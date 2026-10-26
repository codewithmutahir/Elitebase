import type { SupabaseClient } from "@supabase/supabase-js";
import {
  allocateAgainstBalance,
  splitWorkingDaysByLeaveYear,
} from "@/lib/leave-balance/days";
import { getCompanyLeavePolicy, ensureLeaveBalance } from "@/lib/leave-balance/queries";
import {
  balanceBucketForRequestType,
  type LeaveBalanceField,
  type LeaveBucket,
} from "@/lib/leave-balance/types";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import type { TimeOffRequestType } from "@/lib/time-off/queries";
import { createClient } from "@/lib/supabase/server";

type DeductionPlan = {
  year: number;
  bucket: LeaveBucket;
  days: number;
};

async function loadEmployeeWorkContext(
  admin: SupabaseClient,
  companyId: string,
  employeeId: string
): Promise<{ workingDays: number[]; hireDate: string | null } | { error: string }> {
  const { data, error } = await admin
    .from("employees")
    .select("working_days, hire_date")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Employee not found." };
  }

  return {
    workingDays: normalizeWorkingDays(
      Array.isArray(data.working_days) ? (data.working_days as number[]) : []
    ),
    hireDate: (data.hire_date as string | null) ?? null,
  };
}

function buildDeductionPlan(input: {
  requestType: TimeOffRequestType;
  slices: { year: number; days: number }[];
  remainingByYear: Map<number, { sick: number; paid: number }>;
}): { plan: DeductionPlan[]; balanceDays: number; lwpDays: number } {
  const plan: DeductionPlan[] = [];
  let balanceDays = 0;
  let lwpDays = 0;
  const bucketKind = balanceBucketForRequestType(input.requestType);

  for (const slice of input.slices) {
    if (slice.days <= 0) continue;
    if (bucketKind === "unpaid") {
      plan.push({ year: slice.year, bucket: "lwp", days: slice.days });
      lwpDays += slice.days;
      continue;
    }

    const rem = input.remainingByYear.get(slice.year) ?? { sick: 0, paid: 0 };
    const remaining = bucketKind === "sick" ? rem.sick : rem.paid;
    const { charged, lwp } = allocateAgainstBalance(slice.days, remaining);
    if (charged > 0) {
      plan.push({
        year: slice.year,
        bucket: bucketKind,
        days: charged,
      });
      balanceDays += charged;
      if (bucketKind === "sick") rem.sick -= charged;
      else rem.paid -= charged;
      input.remainingByYear.set(slice.year, rem);
    }
    if (lwp > 0) {
      plan.push({ year: slice.year, bucket: "lwp", days: lwp });
      lwpDays += lwp;
    }
  }

  return { plan, balanceDays, lwpDays };
}

async function applyPlanToBalances(
  admin: SupabaseClient,
  companyId: string,
  employeeId: string,
  plan: DeductionPlan[]
): Promise<{ error?: string }> {
  for (const item of plan) {
    if (item.bucket === "lwp") continue;

    const balance = await ensureLeaveBalance(companyId, employeeId, item.year, {
      admin,
    });
    if (!balance) return { error: "Could not load leave balance." };

    const usedCol = item.bucket === "sick" ? "sick_used" : "paid_used";
    const totalCol = item.bucket === "sick" ? "sick_total" : "paid_total";
    const currentUsed = item.bucket === "sick" ? balance.sick_used : balance.paid_used;
    const total = item.bucket === "sick" ? balance.sick_total : balance.paid_total;
    const nextUsed = currentUsed + item.days;
    if (nextUsed > total) {
      return {
        error: `Insufficient ${item.bucket} leave balance for ${item.year}.`,
      };
    }

    const { data: updated, error } = await admin
      .from("leave_balances")
      .update({
        [usedCol]: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", balance.id)
      .eq(usedCol, currentUsed)
      .lte(usedCol, total - item.days)
      .select("id");

    if (error || !updated?.length) {
      console.error("applyPlanToBalances race/fail:", error?.message);
      return {
        error:
          "Leave balance was updated by another action. Refresh and try again.",
      };
    }

    // Satisfy TS unused for totalCol when using dynamic keys
    void totalCol;
  }
  return {};
}

async function reversePlanOnBalances(
  admin: SupabaseClient,
  companyId: string,
  employeeId: string,
  plan: DeductionPlan[]
): Promise<void> {
  for (const item of plan) {
    if (item.bucket === "lwp") continue;
    const balance = await ensureLeaveBalance(companyId, employeeId, item.year, {
      admin,
    });
    if (!balance) continue;
    const usedCol = item.bucket === "sick" ? "sick_used" : "paid_used";
    const currentUsed = item.bucket === "sick" ? balance.sick_used : balance.paid_used;
    const nextUsed = Math.max(0, currentUsed - item.days);
    await admin
      .from("leave_balances")
      .update({
        [usedCol]: nextUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", balance.id);
  }
}

/**
 * Deduct leave balance for an approved request. Call only while status is still pending,
 * then update status in the same flow. On failure, no lasting deduction is kept.
 */
export async function deductBalanceForApproval(input: {
  companyId: string;
  employeeId: string;
  requestId: string;
  requestType: TimeOffRequestType;
  startDate: string;
  endDate: string;
  admin?: SupabaseClient;
}): Promise<
  | { ok: true; balanceDays: number; lwpDays: number; plan: DeductionPlan[] }
  | { ok: false; error: string }
> {
  const admin = input.admin ?? createClient();
  const ctx = await loadEmployeeWorkContext(
    admin,
    input.companyId,
    input.employeeId
  );
  if ("error" in ctx) return { ok: false, error: ctx.error };

  const policy = await getCompanyLeavePolicy(input.companyId, admin);
  const slices = splitWorkingDaysByLeaveYear(
    input.startDate,
    input.endDate,
    ctx.workingDays,
    ctx.hireDate,
    policy.yearType
  );

  if (slices.length === 0) {
    return { ok: true, balanceDays: 0, lwpDays: 0, plan: [] };
  }

  const remainingByYear = new Map<number, { sick: number; paid: number }>();
  for (const slice of slices) {
    const balance = await ensureLeaveBalance(
      input.companyId,
      input.employeeId,
      slice.year,
      { admin, policy, hireDate: ctx.hireDate }
    );
    if (!balance) {
      return { ok: false, error: "Could not initialize leave balance." };
    }
    remainingByYear.set(slice.year, {
      sick: Math.max(0, balance.sick_total - balance.sick_used),
      paid: Math.max(0, balance.paid_total - balance.paid_used),
    });
  }

  const { plan, balanceDays, lwpDays } = buildDeductionPlan({
    requestType: input.requestType,
    slices,
    remainingByYear,
  });

  const applied = await applyPlanToBalances(
    admin,
    input.companyId,
    input.employeeId,
    plan
  );
  if (applied.error) {
    return { ok: false, error: applied.error };
  }

  if (plan.length > 0) {
    const { error: insertError } = await admin.from("leave_balance_deductions").insert(
      plan.map((item) => ({
        company_id: input.companyId,
        employee_id: input.employeeId,
        request_id: input.requestId,
        year: item.year,
        bucket: item.bucket,
        days: item.days,
      }))
    );

    if (insertError) {
      console.error("deductBalanceForApproval ledger:", insertError.message);
      await reversePlanOnBalances(
        admin,
        input.companyId,
        input.employeeId,
        plan
      );
      return { ok: false, error: "Could not record leave deduction." };
    }
  }

  return { ok: true, balanceDays, lwpDays, plan };
}

/** Restore balances for an approved request being cancelled (or undo after failed status flip). */
export async function restoreBalanceForRequest(input: {
  companyId: string;
  employeeId: string;
  requestId: string;
  admin?: SupabaseClient;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = input.admin ?? createClient();

  const { data: rows, error } = await admin
    .from("leave_balance_deductions")
    .select("year, bucket, days")
    .eq("company_id", input.companyId)
    .eq("request_id", input.requestId);

  if (error) {
    console.error("restoreBalanceForRequest load:", error.message);
    return { ok: false, error: "Could not load leave deductions." };
  }

  const plan = ((rows ?? []) as DeductionPlan[]).filter((r) => r.days > 0);
  if (plan.length === 0) return { ok: true };

  await reversePlanOnBalances(
    admin,
    input.companyId,
    input.employeeId,
    plan
  );

  const { error: delError } = await admin
    .from("leave_balance_deductions")
    .delete()
    .eq("request_id", input.requestId)
    .eq("company_id", input.companyId);

  if (delError) {
    console.error("restoreBalanceForRequest delete:", delError.message);
    return { ok: false, error: "Could not clear leave deductions." };
  }

  return { ok: true };
}

export async function adjustLeaveBalance(input: {
  companyId: string;
  employeeId: string;
  year: number;
  bucket: "sick" | "paid";
  field: LeaveBalanceField;
  delta: number;
  reason: string;
  actorUid: string;
  admin?: SupabaseClient;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = input.reason.trim();
  if (reason.length < 3 || reason.length > 500) {
    return { error: "Reason must be 3–500 characters.", ok: false };
  }
  const delta = Math.trunc(input.delta);
  if (!delta || !Number.isFinite(delta)) {
    return { error: "Adjustment amount must be a non-zero integer.", ok: false };
  }
  if (input.year < 2000 || input.year > 2100) {
    return { error: "Invalid leave year.", ok: false };
  }

  const admin = input.admin ?? createClient();
  const balance = await ensureLeaveBalance(
    input.companyId,
    input.employeeId,
    input.year,
    { admin }
  );
  if (!balance) return { ok: false, error: "Could not load leave balance." };

  const beforeTotal =
    input.bucket === "sick" ? balance.sick_total : balance.paid_total;
  const beforeUsed =
    input.bucket === "sick" ? balance.sick_used : balance.paid_used;

  let afterTotal = beforeTotal;
  let afterUsed = beforeUsed;
  if (input.field === "total") {
    afterTotal = beforeTotal + delta;
  } else {
    afterUsed = beforeUsed + delta;
  }

  if (afterTotal < 0 || afterUsed < 0 || afterUsed > afterTotal) {
    return {
      ok: false,
      error:
        "Adjustment would make used exceed total or go negative. Change the amount.",
    };
  }

  const patch =
    input.bucket === "sick"
      ? {
          sick_total: afterTotal,
          sick_used: afterUsed,
          updated_at: new Date().toISOString(),
        }
      : {
          paid_total: afterTotal,
          paid_used: afterUsed,
          updated_at: new Date().toISOString(),
        };

  const { data: updated, error } = await admin
    .from("leave_balances")
    .update(patch)
    .eq("id", balance.id)
    .eq(
      input.bucket === "sick" ? "sick_total" : "paid_total",
      beforeTotal
    )
    .eq(input.bucket === "sick" ? "sick_used" : "paid_used", beforeUsed)
    .select("id");

  if (error || !updated?.length) {
    console.error("adjustLeaveBalance:", error?.message);
    return {
      ok: false,
      error: "Balance changed concurrently. Refresh and try again.",
    };
  }

  const { error: auditError } = await admin
    .from("leave_balance_adjustments")
    .insert({
      company_id: input.companyId,
      employee_id: input.employeeId,
      year: input.year,
      bucket: input.bucket,
      field: input.field,
      delta,
      before_total: beforeTotal,
      before_used: beforeUsed,
      after_total: afterTotal,
      after_used: afterUsed,
      reason,
      actor_uid: input.actorUid,
    });

  if (auditError) {
    console.error("adjustLeaveBalance audit:", auditError.message);
    // Balance already changed — surface soft failure so UI can still refresh.
    return {
      ok: false,
      error: "Balance updated but audit log failed. Contact support if this persists.",
    };
  }

  return { ok: true };
}
