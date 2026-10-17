import { unstable_cache } from "next/cache";
import { cache } from "react";
import { portalEmployeeMonthTag } from "@/lib/cache/tags";
import { dateKeyInTimezone } from "@/lib/dashboard/format";
import {
  buildBonusMonthRow,
  nextPayoutYearMonth,
  type BonusPolicy,
} from "@/lib/payroll/bonus";
import { monthlySalaryPay } from "@/lib/payroll/salary";
import { getMonthRange } from "@/lib/timesheets/dates";
import {
  getTimesheetExportRows,
  type TimesheetExportRow,
} from "@/lib/timesheets/export-rows";
import { listApprovedUnpaidLeaveForRange } from "@/lib/time-off/queries";
import type { PortalEmployee } from "@/lib/portal/queries";

/** Short TTL — punches should show up quickly after revalidateTag. */
const PORTAL_MONTH_REVALIDATE_SECONDS = 60;

export type PortalPaySummary = {
  month: string;
  from: string;
  to: string;
  rows: TimesheetExportRow[];
  totalHours: number;
  shiftWages: number;
  /** Full configured bonus target (policy amount). */
  bonusTarget: number;
  /** Cumulative accrued bonus through this month in the cycle. */
  accruedBonus: number;
  /** Cash bonus due this month (0 unless payout month). */
  bonusAmount: number;
  estimatedPay: number;
  isPayoutMonth: boolean;
  nextPayoutMonth: string | null;
  completeShifts: number;
  openShifts: number;
  lateShifts: number;
  absentDays: number;
};

/** Current YYYY-MM in the company timezone. */
export function currentMonthKey(timezone: string, reference = new Date()): string {
  return dateKeyInTimezone(reference, timezone).slice(0, 7);
}

/** Last `count` months ending at `endMonth` (inclusive), newest first. */
export function recentMonthOptions(endMonth: string, count = 6): string[] {
  if (!/^\d{4}-\d{2}$/.test(endMonth)) return [];
  const [year, month] = endMonth.split("-").map(Number);
  const options: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    options.push(`${y}-${m}`);
  }
  return options;
}

/** Default lookback: current month + previous 23 = 24 months (2 years). */
export const PORTAL_MONTH_SELECT_COUNT = 24;

/**
 * Month picker options always anchored to the company “now” month so selecting
 * an older month never drops the current month from the list.
 * Ensures `selectedMonth` stays in the list if it falls outside the window.
 */
export function portalMonthSelectOptions(
  timezone: string,
  selectedMonth: string,
  count = PORTAL_MONTH_SELECT_COUNT
): string[] {
  const current = currentMonthKey(timezone);
  const options = recentMonthOptions(current, count);
  if (
    /^\d{4}-\d{2}$/.test(selectedMonth) &&
    !options.includes(selectedMonth)
  ) {
    options.push(selectedMonth);
    options.sort((a, b) => b.localeCompare(a));
  }
  return options;
}

/** Group YYYY-MM keys by year for year-sectioned dropdowns (newest year first). */
export function groupPortalMonthsByYear(
  months: string[]
): { year: string; months: string[] }[] {
  const byYear = new Map<string, string[]>();
  for (const month of months) {
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const year = month.slice(0, 4);
    const list = byYear.get(year) ?? [];
    list.push(month);
    byYear.set(year, list);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, yearMonths]) => ({
      year,
      months: yearMonths.sort((a, b) => b.localeCompare(a)),
    }));
}

export function resolvePortalMonth(
  timezone: string,
  monthInput?: string | null
): string {
  if (monthInput && /^\d{4}-\d{2}$/.test(monthInput)) return monthInput;
  return currentMonthKey(timezone);
}

function emptySummary(month: string): PortalPaySummary {
  return {
    month,
    from: `${month}-01`,
    to: `${month}-01`,
    rows: [],
    totalHours: 0,
    shiftWages: 0,
    bonusTarget: 0,
    accruedBonus: 0,
    bonusAmount: 0,
    estimatedPay: 0,
    isPayoutMonth: false,
    nextPayoutMonth: null,
    completeShifts: 0,
    openShifts: 0,
    lateShifts: 0,
    absentDays: 0,
  };
}

async function loadPortalMonthSummary(
  companyId: string,
  employeeId: string,
  timezone: string,
  month: string,
  bonusConfig: {
    bonusAmount: number;
    bonusPolicy: BonusPolicy;
    cycleStartMonth: number;
  },
  payConfig: {
    payType: string | null;
    salaryAmount: number | null;
    workingDays: number[];
  }
): Promise<PortalPaySummary> {
  const range = getMonthRange(month);
  if (!range) return emptySummary(month);

  const [rows, unpaidLeave] = await Promise.all([
    getTimesheetExportRows(
      companyId,
      timezone,
      range.from,
      range.to,
      employeeId
    ),
    listApprovedUnpaidLeaveForRange(companyId, range.from, range.to),
  ]);

  let totalHours = 0;
  let punchWages = 0;
  let completeShifts = 0;
  let openShifts = 0;
  let lateShifts = 0;
  let absentDays = 0;

  for (const row of rows) {
    if (row.totalHours != null) totalHours += row.totalHours;
    punchWages += row.wages;
    if (row.status === "complete") completeShifts += 1;
    if (row.status === "open") openShifts += 1;
    if (row.late) lateShifts += 1;
    if (row.absent) absentDays += 1;
  }

  const employeeLeave = unpaidLeave.filter(
    (leave) => leave.employee_id === employeeId
  );

  const salaryPay =
    payConfig.payType === "salary"
      ? monthlySalaryPay({
          salaryAmount: payConfig.salaryAmount ?? 0,
          yearMonth: month,
          workingDays: payConfig.workingDays,
          unpaidLeaveRanges: employeeLeave,
        })
      : Math.round(punchWages * 100) / 100;

  const bonusRow = buildBonusMonthRow({
    yearMonth: month,
    salaryPay,
    bonusAmount: bonusConfig.bonusAmount,
    policy: bonusConfig.bonusPolicy,
    cycleStartMonth: bonusConfig.cycleStartMonth,
  });

  const bonusAmount = bonusRow?.bonusDue ?? 0;
  const accruedBonus = bonusRow?.accruedBalance ?? 0;
  const estimatedPay =
    bonusRow?.totalDue ??
    Math.round((salaryPay + bonusAmount) * 100) / 100;

  return {
    month,
    from: range.from,
    to: range.to,
    rows,
    totalHours: Math.round(totalHours * 100) / 100,
    shiftWages: salaryPay,
    bonusTarget: Math.max(0, bonusConfig.bonusAmount),
    accruedBonus,
    bonusAmount,
    estimatedPay,
    isPayoutMonth: Boolean(bonusRow?.isPayoutMonth),
    nextPayoutMonth: nextPayoutYearMonth(
      month,
      bonusConfig.cycleStartMonth,
      bonusConfig.bonusPolicy
    ),
    completeShifts,
    openShifts,
    lateShifts,
    absentDays,
  };
}

/**
 * Cached per employee+month. Deduped within a single RSC request via React cache.
 * Invalidate with `invalidatePortalEmployeeMonthCache` after punches / leave.
 */
export const getPortalMonthSummary = cache(
  async (
    employee: PortalEmployee,
    monthInput?: string | null
  ): Promise<PortalPaySummary> => {
    const month = resolvePortalMonth(employee.company_timezone, monthInput);
    const bonusConfig = {
      bonusAmount: employee.bonus_amount,
      bonusPolicy: employee.bonus_policy,
      cycleStartMonth: employee.bonus_cycle_start_month,
    };
    const payConfig = {
      payType: employee.pay_type,
      salaryAmount: employee.salary_amount,
      workingDays: employee.working_days,
    };
    return unstable_cache(
      () =>
        loadPortalMonthSummary(
          employee.company_id,
          employee.id,
          employee.company_timezone,
          month,
          bonusConfig,
          payConfig
        ),
      [
        "portal-month-summary",
        employee.company_id,
        employee.id,
        month,
        String(bonusConfig.bonusAmount),
        bonusConfig.bonusPolicy,
        String(bonusConfig.cycleStartMonth),
        String(payConfig.payType),
        String(payConfig.salaryAmount ?? 0),
        payConfig.workingDays.join(","),
      ],
      {
        revalidate: PORTAL_MONTH_REVALIDATE_SECONDS,
        tags: [portalEmployeeMonthTag(employee.company_id, employee.id)],
      }
    )();
  }
);
