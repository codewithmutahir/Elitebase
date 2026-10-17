import { countWorkingDaysInMonth } from "@/lib/schedules/wages";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import { parseYearMonth } from "@/lib/payroll/bonus";

type UnpaidLeaveRange = {
  start_date: string;
  end_date: string;
};

function isIsoWorkingDay(date: Date, workingDays: number[]): boolean {
  const pgDay = date.getDay();
  const isoDay = pgDay === 0 ? 7 : pgDay;
  return workingDays.includes(isoDay);
}

function eachDateInMonth(year: number, month: number): Date[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: Date[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push(new Date(year, month - 1, day));
  }
  return dates;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isDateInRanges(dateKey: string, ranges: UnpaidLeaveRange[]): boolean {
  return ranges.some(
    (range) => dateKey >= range.start_date && dateKey <= range.end_date
  );
}

/**
 * Excel-style monthly salary pay for salaried employees:
 * full monthly salary minus one daily slice per unpaid-leave day that falls
 * on a configured working day. Accrual / attendance punches are ignored.
 */
export function monthlySalaryPay(input: {
  salaryAmount: number;
  yearMonth: string;
  workingDays: number[];
  unpaidLeaveRanges: UnpaidLeaveRange[];
}): number {
  const salary = Math.max(0, Number(input.salaryAmount) || 0);
  if (salary <= 0) return 0;

  const parsed = parseYearMonth(input.yearMonth);
  if (!parsed) return 0;

  const workingDays = normalizeWorkingDays(input.workingDays);
  const workingDaysInMonth = countWorkingDaysInMonth(
    parsed.year,
    parsed.month,
    workingDays
  );
  const dailyRate = salary / workingDaysInMonth;

  let unpaidWorkingDays = 0;
  for (const date of eachDateInMonth(parsed.year, parsed.month)) {
    if (!isIsoWorkingDay(date, workingDays)) continue;
    const key = formatDateKey(date);
    if (isDateInRanges(key, input.unpaidLeaveRanges)) {
      unpaidWorkingDays += 1;
    }
  }

  const pay = dailyRate * Math.max(0, workingDaysInMonth - unpaidWorkingDays);
  return Math.round(pay * 100) / 100;
}
