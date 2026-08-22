import type { PayType } from "@/lib/employees/profile-queries";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import { shiftDurationHours } from "@/lib/schedules/format";
import type { ScheduleEmployeeRow, ScheduleShift } from "@/lib/schedules/queries";

export type EmployeeCompensation = Pick<
  ScheduleEmployeeRow,
  "hourly_rate" | "pay_type" | "salary_amount" | "working_days"
>;

function countWorkingDaysInMonth(year: number, month: number, workingDays: number[]) {
  const normalized = normalizeWorkingDays(workingDays);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const pgDay = new Date(year, month - 1, day).getDay();
    const isoDay = pgDay === 0 ? 7 : pgDay;
    if (normalized.includes(isoDay)) count += 1;
  }
  return Math.max(count, 1);
}

function countScheduledDaysForEmployee(
  shifts: ScheduleShift[],
  employeeId: string
): number {
  const dates = new Set<string>();
  for (const shift of shifts) {
    if (shift.employee_id !== employeeId) continue;
    dates.add(shift.shift_date);
  }
  return dates.size;
}

export function hourlyShiftWages(hours: number, hourlyRate: number): number {
  return Math.round(hours * hourlyRate * 100) / 100;
}

export function salaryWeekEarnings(
  compensation: EmployeeCompensation,
  shifts: ScheduleShift[],
  employeeId: string,
  weekMonday: Date
): number {
  const salary = compensation.salary_amount ?? 0;
  if (salary <= 0) return 0;

  const scheduledDays = countScheduledDaysForEmployee(shifts, employeeId);
  if (scheduledDays === 0) return 0;

  const month = weekMonday.getMonth() + 1;
  const year = weekMonday.getFullYear();
  const workingDaysInMonth = countWorkingDaysInMonth(
    year,
    month,
    compensation.working_days
  );
  const dailyRate = salary / workingDaysInMonth;
  return Math.round(dailyRate * scheduledDays * 100) / 100;
}

export function employeeWeekEarnings(
  compensation: EmployeeCompensation,
  shifts: ScheduleShift[],
  employeeId: string,
  weekMonday: Date
): { hours: number; wages: number } {
  let hours = 0;
  for (const shift of shifts) {
    if (shift.employee_id !== employeeId) continue;
    hours += shiftDurationHours(shift.start_time, shift.end_time);
  }

  if (compensation.pay_type === "salary") {
    return {
      hours,
      wages: salaryWeekEarnings(compensation, shifts, employeeId, weekMonday),
    };
  }

  return {
    hours,
    wages: hourlyShiftWages(hours, compensation.hourly_rate),
  };
}

export function dayEarnings(
  employeesById: Map<string, ScheduleEmployeeRow>,
  shifts: ScheduleShift[],
  shiftDate: string,
  weekMonday: Date
): { hours: number; wages: number } {
  let hours = 0;
  let wages = 0;

  for (const shift of shifts) {
    if (shift.shift_date !== shiftDate) continue;
    const shiftHours = shiftDurationHours(shift.start_time, shift.end_time);
    hours += shiftHours;

    if (!shift.employee_id) continue;
    const employee = employeesById.get(shift.employee_id);
    if (!employee) continue;

    if (employee.pay_type === "salary") {
      const month = weekMonday.getMonth() + 1;
      const year = weekMonday.getFullYear();
      const workingDaysInMonth = countWorkingDaysInMonth(
        year,
        month,
        employee.working_days
      );
      const dailyRate = (employee.salary_amount ?? 0) / workingDaysInMonth;
      wages += dailyRate;
    } else {
      wages += hourlyShiftWages(shiftHours, employee.hourly_rate);
    }
  }

  return {
    hours,
    wages: Math.round(wages * 100) / 100,
  };
}

export function earningsLabel(payType: PayType): string {
  return payType === "salary" ? "Est. earnings" : "Wages";
}
