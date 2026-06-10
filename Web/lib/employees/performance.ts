import { createClient } from "@/lib/supabase/server";
import { shiftDurationHours } from "@/lib/schedules/format";

export type EmployeePerformanceStats = {
  onTimeRate: string;
  avgHoursPerWeek: string;
  missedClockOuts: number;
  noShows: number;
  avgShiftRating: string;
  shiftsWorked: number;
  missedBreaks: number;
  roleBreakdown: { roleName: string; hours: number }[];
  monthLabel: string;
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    weeks: Math.max(1, Math.ceil((end.getDate() - start.getDate() + 1) / 7)),
  };
}

export async function getEmployeePerformanceStats(
  companyId: string,
  employeeId: string
): Promise<EmployeePerformanceStats> {
  const admin = createClient();
  const { start, end, startDate, endDate, label, weeks } = monthBounds();

  const { data: attendance } = await admin
    .from("attendance")
    .select("type, timestamp")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("timestamp", start)
    .lte("timestamp", end)
    .order("timestamp", { ascending: true });

  const records = attendance ?? [];
  const clockIns = records.filter((r) => r.type === "clock_in");
  const shiftsWorked = clockIns.length;

  const byDay = new Map<string, { clockIn?: Date; clockOut?: Date; breaks: { start?: Date; end?: Date }[] }>();

  for (const row of records) {
    const ts = new Date(row.timestamp);
    const day = ts.toISOString().slice(0, 10);
    const entry = byDay.get(day) ?? { breaks: [] };

    if (row.type === "clock_in") entry.clockIn = ts;
    if (row.type === "clock_out") entry.clockOut = ts;
    if (row.type === "break_start") entry.breaks.push({ start: ts });
    if (row.type === "break_end") {
      const open = entry.breaks.find((b) => b.start && !b.end);
      if (open) open.end = ts;
      else entry.breaks.push({ end: ts });
    }

    byDay.set(day, entry);
  }

  let missedClockOuts = 0;
  let missedBreaks = 0;
  let totalHours = 0;

  for (const [, day] of byDay) {
    if (day.clockIn && !day.clockOut) missedClockOuts += 1;
    if (day.clockIn && day.clockOut) {
      totalHours +=
        (day.clockOut.getTime() - day.clockIn.getTime()) / (1000 * 60 * 60);
    }
    for (const br of day.breaks) {
      if (br.start && !br.end) missedBreaks += 1;
    }
  }

  const { data: schedules } = await admin
    .from("schedules")
    .select("shift_date, start_time")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("shift_date", startDate)
    .lte("shift_date", endDate)
    .eq("status", "published");

  let onTimeCount = 0;
  let scheduledWithAttendance = 0;

  for (const shift of schedules ?? []) {
    const dayEntry = byDay.get(shift.shift_date);
    if (!dayEntry?.clockIn) continue;
    scheduledWithAttendance += 1;
    const [sh, sm] = shift.start_time.split(":").map(Number);
    const scheduledStart = new Date(`${shift.shift_date}T00:00:00`);
    scheduledStart.setHours(sh, sm || 0, 0, 0);
    const diffMin =
      Math.abs(dayEntry.clockIn.getTime() - scheduledStart.getTime()) / 60000;
    if (diffMin <= 5) onTimeCount += 1;
  }

  const scheduledDays = new Set((schedules ?? []).map((s) => s.shift_date));
  let noShows = 0;
  for (const day of scheduledDays) {
    const entry = byDay.get(day);
    if (!entry?.clockIn) noShows += 1;
  }

  const onTimeRate =
    scheduledWithAttendance === 0
      ? "--%"
      : `${Math.round((onTimeCount / scheduledWithAttendance) * 100)}%`;

  const avgHoursPerWeek =
    shiftsWorked === 0 ? "0.00" : (totalHours / weeks).toFixed(2);

  const { data: shiftRows } = await admin
    .from("schedules")
    .select("start_time, end_time, role_id, roles ( name )")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("shift_date", startDate)
    .lte("shift_date", endDate);

  const roleHours = new Map<string, number>();
  for (const row of shiftRows ?? []) {
    const roles = row.roles as { name: string } | { name: string }[] | null;
    const roleName = Array.isArray(roles)
      ? roles[0]?.name
      : roles?.name ?? (row.role_id ? "Scheduled role" : "General");
    const hours = shiftDurationHours(row.start_time, row.end_time);
    roleHours.set(roleName, (roleHours.get(roleName) ?? 0) + hours);
  }

  const roleBreakdown = Array.from(roleHours.entries()).map(([roleName, hours]) => ({
    roleName,
    hours,
  }));

  return {
    onTimeRate,
    avgHoursPerWeek,
    missedClockOuts,
    noShows,
    avgShiftRating: "0 ★",
    shiftsWorked,
    missedBreaks,
    roleBreakdown,
    monthLabel: label,
  };
}
