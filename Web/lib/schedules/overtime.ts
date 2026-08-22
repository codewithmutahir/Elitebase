import { shiftDurationHours } from "@/lib/schedules/format";
import type { ScheduleShift } from "@/lib/schedules/queries";

export const DAILY_OVERTIME_HOURS = 8;
export const WEEKLY_OVERTIME_HOURS = 40;

export type OvertimeWarning = {
  kind: "daily" | "weekly";
  employeeId: string;
  employeeName: string;
  date?: string;
  hours: number;
  threshold: number;
};

export function getScheduleOvertimeWarnings(
  shifts: ScheduleShift[],
  employeeNames: Map<string, string>,
  draftOnly = true
): OvertimeWarning[] {
  const relevant = draftOnly
    ? shifts.filter((shift) => shift.status === "draft" && shift.employee_id)
    : shifts.filter((shift) => shift.employee_id);

  const warnings: OvertimeWarning[] = [];
  const dailyHours = new Map<string, number>();
  const weeklyHours = new Map<string, number>();

  for (const shift of relevant) {
    const employeeId = shift.employee_id!;
    const hours = shiftDurationHours(shift.start_time, shift.end_time);
    const dayKey = `${employeeId}:${shift.shift_date}`;
    dailyHours.set(dayKey, (dailyHours.get(dayKey) ?? 0) + hours);
    weeklyHours.set(employeeId, (weeklyHours.get(employeeId) ?? 0) + hours);
  }

  for (const [dayKey, hours] of dailyHours) {
    if (hours <= DAILY_OVERTIME_HOURS) continue;
    const [employeeId, date] = dayKey.split(":");
    warnings.push({
      kind: "daily",
      employeeId,
      employeeName: employeeNames.get(employeeId) ?? "Employee",
      date,
      hours: Math.round(hours * 100) / 100,
      threshold: DAILY_OVERTIME_HOURS,
    });
  }

  for (const [employeeId, hours] of weeklyHours) {
    if (hours <= WEEKLY_OVERTIME_HOURS) continue;
    warnings.push({
      kind: "weekly",
      employeeId,
      employeeName: employeeNames.get(employeeId) ?? "Employee",
      hours: Math.round(hours * 100) / 100,
      threshold: WEEKLY_OVERTIME_HOURS,
    });
  }

  warnings.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  return warnings;
}

export function formatOvertimeWarning(warning: OvertimeWarning): string {
  if (warning.kind === "daily") {
    return `${warning.employeeName} — ${warning.hours}h on ${warning.date} (over ${warning.threshold}h/day)`;
  }
  return `${warning.employeeName} — ${warning.hours}h this week (over ${warning.threshold}h/week)`;
}
