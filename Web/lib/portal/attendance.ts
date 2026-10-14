import { unstable_cache } from "next/cache";
import { cache } from "react";
import { portalEmployeeMonthTag } from "@/lib/cache/tags";
import { dateKeyInTimezone } from "@/lib/dashboard/format";
import { getMonthRange } from "@/lib/timesheets/dates";
import {
  getTimesheetExportRows,
  type TimesheetExportRow,
} from "@/lib/timesheets/export-rows";
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
  bonusAmount: number;
  estimatedPay: number;
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
    bonusAmount: 0,
    estimatedPay: 0,
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
  bonusFallback: number
): Promise<PortalPaySummary> {
  const range = getMonthRange(month);
  if (!range) return emptySummary(month);

  const rows = await getTimesheetExportRows(
    companyId,
    timezone,
    range.from,
    range.to,
    employeeId
  );

  let totalHours = 0;
  let shiftWages = 0;
  let completeShifts = 0;
  let openShifts = 0;
  let lateShifts = 0;
  let absentDays = 0;

  for (const row of rows) {
    if (row.totalHours != null) totalHours += row.totalHours;
    shiftWages += row.wages;
    if (row.status === "complete") completeShifts += 1;
    if (row.status === "open") openShifts += 1;
    if (row.late) lateShifts += 1;
    if (row.absent) absentDays += 1;
  }

  const bonusAmount = rows[0]?.bonusAmount ?? bonusFallback;
  const estimatedPay = Math.round((shiftWages + bonusAmount) * 100) / 100;

  return {
    month,
    from: range.from,
    to: range.to,
    rows,
    totalHours: Math.round(totalHours * 100) / 100,
    shiftWages: Math.round(shiftWages * 100) / 100,
    bonusAmount,
    estimatedPay,
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
    return unstable_cache(
      () =>
        loadPortalMonthSummary(
          employee.company_id,
          employee.id,
          employee.company_timezone,
          month,
          0
        ),
      [
        "portal-month-summary",
        employee.company_id,
        employee.id,
        month,
      ],
      {
        revalidate: PORTAL_MONTH_REVALIDATE_SECONDS,
        tags: [portalEmployeeMonthTag(employee.company_id, employee.id)],
      }
    )();
  }
);
