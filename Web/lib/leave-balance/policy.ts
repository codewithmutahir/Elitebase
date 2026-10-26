import type { LeavePolicy, LeaveYearType } from "@/lib/leave-balance/types";

export const DEFAULT_LEAVE_POLICY: LeavePolicy = {
  sickTotalDefault: 6,
  paidTotalDefault: 6,
  yearType: "calendar",
  prorateMidYear: false,
};

export function isLeaveYearType(value: unknown): value is LeaveYearType {
  return value === "calendar" || value === "anniversary";
}

export function normalizeLeaveYearType(value: unknown): LeaveYearType {
  return isLeaveYearType(value) ? value : DEFAULT_LEAVE_POLICY.yearType;
}

export function clampLeaveTotal(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(366, Math.max(0, Math.trunc(n)));
}

export function parseLeavePolicy(input: {
  leave_sick_total_default?: unknown;
  leave_paid_total_default?: unknown;
  leave_year_type?: unknown;
  leave_prorate_mid_year?: unknown;
} | null | undefined): LeavePolicy {
  if (!input) return { ...DEFAULT_LEAVE_POLICY };
  return {
    sickTotalDefault: clampLeaveTotal(
      input.leave_sick_total_default,
      DEFAULT_LEAVE_POLICY.sickTotalDefault
    ),
    paidTotalDefault: clampLeaveTotal(
      input.leave_paid_total_default,
      DEFAULT_LEAVE_POLICY.paidTotalDefault
    ),
    yearType: normalizeLeaveYearType(input.leave_year_type),
    prorateMidYear: Boolean(input.leave_prorate_mid_year),
  };
}

/**
 * Leave-year key for a calendar date.
 * - calendar: the date's calendar year
 * - anniversary: year of the leave-year start anchored on hire month/day
 */
export function leaveYearForDate(
  isoDate: string,
  hireDate: string | null | undefined,
  yearType: LeaveYearType
): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  if (!Number.isInteger(year) || year < 2000) return new Date().getFullYear();

  if (yearType !== "anniversary" || !hireDate || !/^\d{4}-\d{2}-\d{2}/.test(hireDate)) {
    return year;
  }

  const hireMonth = Number(hireDate.slice(5, 7));
  const hireDay = Number(hireDate.slice(8, 10));
  if (month > hireMonth || (month === hireMonth && day >= hireDay)) {
    return year;
  }
  return year - 1;
}

/**
 * Pro-rate annual totals for mid-year joiners when enabled.
 * Formula: round(default * remainingMonthsInclusive / 12).
 */
export function prorateLeaveTotal(
  annualTotal: number,
  year: number,
  hireDate: string | null | undefined,
  prorateMidYear: boolean,
  yearType: LeaveYearType
): number {
  if (!prorateMidYear || !hireDate || !/^\d{4}-\d{2}-\d{2}/.test(hireDate)) {
    return annualTotal;
  }

  const hireYear = Number(hireDate.slice(0, 4));
  const hireMonth = Number(hireDate.slice(5, 7));

  if (yearType === "calendar") {
    if (hireYear < year) return annualTotal;
    if (hireYear > year) return 0;
    const remainingMonths = 12 - hireMonth + 1;
    return Math.round((annualTotal * remainingMonths) / 12);
  }

  // Anniversary leave year starting at `year`-hireMonth: full allotment
  // unless hire falls after that year's start (first partial year).
  if (hireYear > year) return 0;
  if (hireYear < year) return annualTotal;
  const remainingMonths = 12 - hireMonth + 1;
  return Math.round((annualTotal * remainingMonths) / 12);
}
