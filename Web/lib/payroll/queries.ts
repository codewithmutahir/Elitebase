import { createClient } from "@/lib/supabase/server";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import {
  buildBonusMonthRow,
  formatBonusPolicyLabel,
  normalizeBonusPolicy,
  normalizeCycleStartMonth,
  yearMonthKeys,
  type BonusMonthRow,
  type BonusPolicy,
} from "@/lib/payroll/bonus";
import { monthlySalaryPay } from "@/lib/payroll/salary";
import { listApprovedUnpaidLeaveForRange } from "@/lib/time-off/queries";
import { getTimesheetExportRows } from "@/lib/timesheets/export-rows";

export type PayrollEmployeeOption = {
  id: string;
  full_name: string;
  pay_type: "hourly" | "salary";
  salary_amount: number | null;
  hourly_rate: number;
  working_days: number[];
  bonus_amount: number;
  bonus_policy: BonusPolicy;
  bonus_cycle_start_month: number;
  hire_date: string | null;
};

export type PayrollYearBreakdown = {
  employee: PayrollEmployeeOption;
  year: number;
  policyLabel: string;
  months: BonusMonthRow[];
};

export async function listPayrollEmployees(
  companyId: string
): Promise<PayrollEmployeeOption[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, pay_type, salary_amount, hourly_rate, working_days, bonus_amount, bonus_policy, bonus_cycle_start_month, hire_date, status, is_active"
    )
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listPayrollEmployees:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.status === "active" && row.is_active !== false)
    .map((row) => ({
      id: row.id as string,
      full_name: String(row.full_name ?? "Unknown").trim(),
      pay_type: (row.pay_type as string) === "salary" ? "salary" : "hourly",
      salary_amount:
        row.salary_amount != null ? Number(row.salary_amount) : null,
      hourly_rate: Number(row.hourly_rate ?? 0),
      working_days: normalizeWorkingDays(
        (row.working_days as number[] | null) ?? [1, 2, 3, 4, 5]
      ),
      bonus_amount: Number(row.bonus_amount ?? 0),
      bonus_policy: normalizeBonusPolicy(row.bonus_policy),
      bonus_cycle_start_month: normalizeCycleStartMonth(
        row.bonus_cycle_start_month
      ),
      hire_date: (row.hire_date as string | null) ?? null,
    }));
}

export async function getPayrollYearBreakdown(
  companyId: string,
  timezone: string,
  employee: PayrollEmployeeOption,
  year: number
): Promise<PayrollYearBreakdown> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const unpaidLeave = await listApprovedUnpaidLeaveForRange(
    companyId,
    from,
    to
  );
  const employeeLeave = unpaidLeave.filter(
    (row) => row.employee_id === employee.id
  );

  let wagesByMonth = new Map<string, number>();
  if (employee.pay_type === "hourly") {
    const rows = await getTimesheetExportRows(
      companyId,
      timezone,
      from,
      to,
      employee.id
    );
    for (const row of rows) {
      const key = row.date.slice(0, 7);
      wagesByMonth.set(
        key,
        Math.round(((wagesByMonth.get(key) ?? 0) + row.wages) * 100) / 100
      );
    }
  }

  const months: BonusMonthRow[] = [];
  for (const yearMonth of yearMonthKeys(year)) {
    const salaryPay =
      employee.pay_type === "salary"
        ? monthlySalaryPay({
            salaryAmount: employee.salary_amount ?? 0,
            yearMonth,
            workingDays: employee.working_days,
            unpaidLeaveRanges: employeeLeave,
          })
        : (wagesByMonth.get(yearMonth) ?? 0);

    const row = buildBonusMonthRow({
      yearMonth,
      salaryPay,
      bonusAmount: employee.bonus_amount,
      policy: employee.bonus_policy,
      cycleStartMonth: employee.bonus_cycle_start_month,
    });
    if (row) months.push(row);
  }

  return {
    employee,
    year,
    policyLabel: formatBonusPolicyLabel(employee.bonus_policy),
    months,
  };
}
