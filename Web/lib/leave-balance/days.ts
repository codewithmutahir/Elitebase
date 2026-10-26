import { normalizeWorkingDays } from "@/lib/employees/working-days";
import { leaveYearForDate } from "@/lib/leave-balance/policy";
import type { LeaveYearType, YearDaySlice } from "@/lib/leave-balance/types";

function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isIsoWorkingDay(date: Date, workingDays: number[]): boolean {
  const pgDay = date.getDay();
  const isoDay = pgDay === 0 ? 7 : pgDay;
  return workingDays.includes(isoDay);
}

/**
 * Count employee working days in [start, end] inclusive.
 * Half-days are not supported — each matching calendar day counts as 1.
 */
export function countWorkingDaysInRange(
  startDate: string,
  endDate: string,
  workingDays: number[]
): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) return 0;

  const normalized = normalizeWorkingDays(workingDays);
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isIsoWorkingDay(cursor, normalized)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/**
 * Split working days in a leave range across leave-year keys.
 */
export function splitWorkingDaysByLeaveYear(
  startDate: string,
  endDate: string,
  workingDays: number[],
  hireDate: string | null | undefined,
  yearType: LeaveYearType
): YearDaySlice[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || end < start) return [];

  const normalized = normalizeWorkingDays(workingDays);
  const byYear = new Map<number, number>();
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isIsoWorkingDay(cursor, normalized)) {
      const iso = formatIso(cursor);
      const year = leaveYearForDate(iso, hireDate, yearType);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return [...byYear.entries()]
    .map(([year, days]) => ({ year, days }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Allocate requested days against remaining balance; overflow becomes LWP.
 */
export function allocateAgainstBalance(
  requestedDays: number,
  remaining: number
): { charged: number; lwp: number } {
  const days = Math.max(0, Math.trunc(requestedDays));
  const rem = Math.max(0, Math.trunc(remaining));
  const charged = Math.min(days, rem);
  return { charged, lwp: days - charged };
}
