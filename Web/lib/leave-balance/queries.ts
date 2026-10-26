import { cache } from "react";
import { unstable_cache } from "next/cache";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import {
  portalCompanyLeaveTag,
  portalEmployeeLeaveTag,
} from "@/lib/cache/tags";
import { parseLeavePolicy, prorateLeaveTotal } from "@/lib/leave-balance/policy";
import {
  toLeaveBalanceView,
  type LeaveBalanceRow,
  type LeaveBalanceView,
  type LeavePolicy,
} from "@/lib/leave-balance/types";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { LeaveBalanceView, LeavePolicy };

export async function getCompanyLeavePolicy(
  companyId: string,
  admin: SupabaseClient = createClient()
): Promise<LeavePolicy> {
  const { data, error } = await admin
    .from("companies")
    .select(
      "leave_sick_total_default, leave_paid_total_default, leave_year_type, leave_prorate_mid_year"
    )
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("getCompanyLeavePolicy:", error.message);
    return parseLeavePolicy(null);
  }
  return parseLeavePolicy(data);
}

export async function getLeaveBalance(
  companyId: string,
  employeeId: string,
  year: number,
  admin: SupabaseClient = createClient()
): Promise<LeaveBalanceRow | null> {
  const { data, error } = await admin
    .from("leave_balances")
    .select(
      "id, company_id, employee_id, year, sick_total, sick_used, paid_total, paid_used"
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("year", year)
    .maybeSingle();

  if (error) {
    console.error("getLeaveBalance:", error.message);
    return null;
  }
  return data as LeaveBalanceRow | null;
}

/**
 * Ensure a balance row exists for the leave year (idempotent).
 * Uses company policy + optional hire-date pro-rata for initial totals.
 */
export async function ensureLeaveBalance(
  companyId: string,
  employeeId: string,
  year: number,
  options?: {
    admin?: SupabaseClient;
    policy?: LeavePolicy;
    hireDate?: string | null;
  }
): Promise<LeaveBalanceRow | null> {
  const admin = options?.admin ?? createClient();
  const existing = await getLeaveBalance(companyId, employeeId, year, admin);
  if (existing) return existing;

  const policy = options?.policy ?? (await getCompanyLeavePolicy(companyId, admin));
  let hireDate: string | null;
  if (options && "hireDate" in options) {
    hireDate = options.hireDate ?? null;
  } else {
    const { data: emp } = await admin
      .from("employees")
      .select("hire_date")
      .eq("id", employeeId)
      .eq("company_id", companyId)
      .maybeSingle();
    hireDate = (emp?.hire_date as string | null) ?? null;
  }

  const sickTotal = prorateLeaveTotal(
    policy.sickTotalDefault,
    year,
    hireDate,
    policy.prorateMidYear,
    policy.yearType
  );
  const paidTotal = prorateLeaveTotal(
    policy.paidTotalDefault,
    year,
    hireDate,
    policy.prorateMidYear,
    policy.yearType
  );

  const { data, error } = await admin
    .from("leave_balances")
    .upsert(
      {
        company_id: companyId,
        employee_id: employeeId,
        year,
        sick_total: sickTotal,
        sick_used: 0,
        paid_total: paidTotal,
        paid_used: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,year", ignoreDuplicates: true }
    )
    .select(
      "id, company_id, employee_id, year, sick_total, sick_used, paid_total, paid_used"
    )
    .maybeSingle();

  if (error) {
    // Race: another writer inserted — re-read.
    const raced = await getLeaveBalance(companyId, employeeId, year, admin);
    if (raced) return raced;
    console.error("ensureLeaveBalance:", error.message);
    return null;
  }

  if (data) return data as LeaveBalanceRow;
  return getLeaveBalance(companyId, employeeId, year, admin);
}

export async function getLeaveBalanceView(
  companyId: string,
  employeeId: string,
  year: number,
  admin?: SupabaseClient
): Promise<LeaveBalanceView | null> {
  const row = await ensureLeaveBalance(companyId, employeeId, year, { admin });
  return row ? toLeaveBalanceView(row) : null;
}

async function loadEmployeeLeaveBalanceView(
  companyId: string,
  employeeId: string,
  year: number
): Promise<LeaveBalanceView | null> {
  return getLeaveBalanceView(companyId, employeeId, year);
}

/** Portal-cached leave balance for the given leave year. */
export const getCachedEmployeeLeaveBalance = cache(
  async (
    companyId: string,
    employeeId: string,
    year: number
  ): Promise<LeaveBalanceView | null> =>
    unstable_cache(
      () => loadEmployeeLeaveBalanceView(companyId, employeeId, year),
      ["portal-employee-leave-balance", companyId, employeeId, String(year)],
      {
        revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
        tags: [
          portalEmployeeLeaveTag(companyId, employeeId),
          portalCompanyLeaveTag(companyId),
        ],
      }
    )()
);

export async function listLeaveBalancesForCompanyYear(
  companyId: string,
  year: number
): Promise<LeaveBalanceView[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("leave_balances")
    .select(
      "id, company_id, employee_id, year, sick_total, sick_used, paid_total, paid_used"
    )
    .eq("company_id", companyId)
    .eq("year", year);

  if (error) {
    console.error("listLeaveBalancesForCompanyYear:", error.message);
    return [];
  }

  return ((data ?? []) as LeaveBalanceRow[]).map(toLeaveBalanceView);
}

export type LeaveBalanceAdjustmentRow = {
  id: string;
  year: number;
  bucket: "sick" | "paid";
  field: "total" | "used";
  delta: number;
  before_total: number;
  before_used: number;
  after_total: number;
  after_used: number;
  reason: string;
  actor_uid: string;
  created_at: string;
};

export async function listLeaveBalanceAdjustments(
  companyId: string,
  employeeId: string,
  limit = 20
): Promise<LeaveBalanceAdjustmentRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("leave_balance_adjustments")
    .select(
      "id, year, bucket, field, delta, before_total, before_used, after_total, after_used, reason, actor_uid, created_at"
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listLeaveBalanceAdjustments:", error.message);
    return [];
  }
  return (data ?? []) as LeaveBalanceAdjustmentRow[];
}
