/**
 * Server helpers to assemble CalculatePayslipInput from DB rows.
 * Used by Phase 3 generate/preview actions — kept pure-data, no UI.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { leaveYearForDate } from "@/lib/leave-balance/policy";
import { getCompanyLeavePolicy, ensureLeaveBalance } from "@/lib/leave-balance/queries";
import { toLeaveBalanceView } from "@/lib/leave-balance/types";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import { formatBonusPolicyLabel, normalizeBonusPolicy } from "@/lib/payroll/bonus";
import type { CalculatePayslipInput } from "@/lib/payslips/calculate";
import { createClient } from "@/lib/supabase/server";

function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export async function loadPayslipCalcInput(options: {
  companyId: string;
  employeeId: string;
  year: number;
  month: number;
  admin?: SupabaseClient;
}): Promise<
  | { ok: true; input: CalculatePayslipInput; currency: string | null }
  | { ok: false; error: string }
> {
  const admin = options.admin ?? createClient();
  const { companyId, employeeId, year, month } = options;
  const { from, to } = monthBounds(year, month);

  const { data: employee, error: empError } = await admin
    .from("employees")
    .select(
      `
      id, full_name, position, department_id, hire_date,
      salary_amount, working_days, bonus_amount, bonus_policy,
      departments ( name )
    `
    )
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (empError || !employee) {
    return { ok: false, error: "Employee not found." };
  }

  const { data: company } = await admin
    .from("companies")
    .select("currency, lates_per_day_deduction, late_remainder_carry_month, leave_year_type")
    .eq("id", companyId)
    .maybeSingle();

  const policy = await getCompanyLeavePolicy(companyId, admin);
  const leaveYear = leaveYearForDate(
    from,
    employee.hire_date as string | null,
    policy.yearType
  );
  const balanceRow = await ensureLeaveBalance(companyId, employeeId, leaveYear, {
    admin,
    policy,
    hireDate: (employee.hire_date as string | null) ?? null,
  });
  const balanceView = balanceRow
    ? toLeaveBalanceView(balanceRow)
    : {
        sickRemaining: 0,
        paidRemaining: 0,
        totalRemaining: 0,
        sickTotal: 0,
        sickUsed: 0,
        paidTotal: 0,
        paidUsed: 0,
        totalAllotted: 0,
        totalUsed: 0,
        year: leaveYear,
      };

  const [{ data: allowances }, { data: loans }, { data: lateRows }, { data: leaveRows }] =
    await Promise.all([
      admin
        .from("employee_allowances")
        .select("id, label, amount_cents")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("employee_loans")
        .select("id, label, balance_cents, installment_cents")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("is_active", true),
      admin
        .from("attendance")
        .select("id, timestamp, attendance_status")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("type", "clock_in")
        .eq("attendance_status", "late")
        .is("voided_at", null)
        .gte("timestamp", `${from}T00:00:00.000Z`)
        .lte("timestamp", `${to}T23:59:59.999Z`),
      admin
        .from("time_off_requests")
        .select("start_date, end_date, request_type, lwp_days, balance_days_charged, status")
        .eq("company_id", companyId)
        .eq("employee_id", employeeId)
        .eq("status", "approved")
        .lte("start_date", to)
        .gte("end_date", from),
    ]);

  // Late count: distinct calendar days (company TZ refinement deferred — UTC date for now).
  const lateDays = new Set<string>();
  for (const row of lateRows ?? []) {
    const ts = String(row.timestamp);
    lateDays.add(ts.slice(0, 10));
  }

  let unpaidLeaveDays = 0;
  let paidLeaveDays = 0;
  let sickLeaveDays = 0;
  for (const row of leaveRows ?? []) {
    const type = String(row.request_type);
    const lwp = Number(row.lwp_days ?? 0);
    const charged = Number(row.balance_days_charged ?? 0);
    unpaidLeaveDays += lwp;
    if (type === "unpaid" || type === "unpaid_leave") {
      unpaidLeaveDays += charged;
    } else if (type === "sick") {
      sickLeaveDays += charged;
    } else {
      paidLeaveDays += charged;
    }
  }

  const deptJoin = employee.departments as
    | { name: string }
    | { name: string }[]
    | null;
  const department = Array.isArray(deptJoin)
    ? deptJoin[0]?.name ?? null
    : deptJoin?.name ?? null;

  const bonusPolicy = normalizeBonusPolicy(employee.bonus_policy);

  const input: CalculatePayslipInput = {
    employeeName: employee.full_name as string,
    employeeId,
    designation: (employee.position as string | null) ?? null,
    department,
    month,
    year,
    workingDaysIso: normalizeWorkingDays(
      Array.isArray(employee.working_days)
        ? (employee.working_days as number[])
        : []
    ),
    baseSalaryMajor: Number(employee.salary_amount ?? 0),
    bonusAccruedMajor: Number(employee.bonus_amount ?? 0),
    bonusPolicyLabel: formatBonusPolicyLabel(bonusPolicy),
    leaveBalance: {
      sickRemaining: balanceView.sickRemaining,
      paidRemaining: balanceView.paidRemaining,
      totalRemaining: balanceView.totalRemaining,
    },
    attendance: {
      lateCount: lateDays.size,
      presentDays: 0,
      absentDays: 0,
      paidLeaveDays,
      sickLeaveDays,
      unpaidLeaveDays,
      offDays: 0,
    },
    allowances: (allowances ?? []).map((a) => ({
      id: a.id as string,
      label: a.label as string,
      amountCents: Number(a.amount_cents ?? 0),
    })),
    loans: (loans ?? []).map((l) => ({
      id: l.id as string,
      label: l.label as string,
      balanceCents: Number(l.balance_cents ?? 0),
      installmentCents: Number(l.installment_cents ?? 0),
    })),
    latesPerDayDeduction: Number(company?.lates_per_day_deduction ?? 3),
    carriedLateRemainder: 0,
  };

  return {
    ok: true,
    input,
    currency: (company?.currency as string | null) ?? null,
  };
}
