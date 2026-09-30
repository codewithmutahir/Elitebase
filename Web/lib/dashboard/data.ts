import { createClient } from "@/lib/supabase/server";
import { getDefaultWeekRange } from "@/lib/timesheets/dates";
import { buildTimesheetRows, type AttendanceEvent } from "@/lib/timesheets/pairing";
import { attendanceLabel, companyTimezone, dateKeyInTimezone } from "./format";

type AttendanceRow = {
  id: string;
  type: string;
  timestamp: string;
  employee_id: string;
  employees: { full_name: string } | { full_name: string }[] | null;
};

function employeeName(
  employees: AttendanceRow["employees"]
): string {
  if (!employees) return "Unknown";
  if (Array.isArray(employees)) {
    return employees[0]?.full_name ?? "Unknown";
  }
  return employees.full_name ?? "Unknown";
}

export type ClockedInEmployee = {
  employeeId: string;
  fullName: string;
  lastType: string;
  lastTimestamp: string;
};

export type RecentAttendanceRow = {
  id: string;
  type: string;
  timestamp: string;
  fullName: string;
};

export type DashboardData = {
  employeeCount: number;
  todaysClockIns: number;
  weekHours: number;
  clockedIn: ClockedInEmployee[];
  recentAttendance: RecentAttendanceRow[];
};

function isClockedIn(type: string) {
  return type === "clock_in" || type === "break_end";
}

export async function getDashboardData(
  companyId: string,
  timezoneInput: string | null | undefined
): Promise<DashboardData> {
  const admin = createClient();
  const timezone = companyTimezone(timezoneInput);
  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const lookbackStart = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: employeeCount, error: countError } = await admin
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (countError) {
    console.error("Dashboard: employee count failed", countError.message);
  }

  const { data: todayRows, error: todayError } = await admin
    .from("attendance")
    .select("id, type, timestamp")
    .eq("company_id", companyId)
    .is("voided_at", null)
    .gte("timestamp", lookbackStart);

  if (todayError) {
    console.error("Dashboard: today attendance failed", todayError.message);
  }

  const todaysClockIns =
    todayRows?.filter(
      (row) =>
        row.type === "clock_in" &&
        dateKeyInTimezone(new Date(row.timestamp), timezone) === todayKey
    ).length ?? 0;

  const { data: weekRows, error: weekError } = await admin
    .from("attendance")
    .select(
      "id, employee_id, type, timestamp, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .is("voided_at", null)
    .gte("timestamp", weekAgo)
    .order("timestamp", { ascending: false });

  if (weekError) {
    console.error("Dashboard: week attendance failed", weekError.message);
  }

  const latestByEmployee = new Map<string, AttendanceRow>();
  for (const row of (weekRows ?? []) as AttendanceRow[]) {
    if (!latestByEmployee.has(row.employee_id)) {
      latestByEmployee.set(row.employee_id, row);
    }
  }

  const clockedIn: ClockedInEmployee[] = [];
  for (const row of latestByEmployee.values()) {
    if (!isClockedIn(row.type)) continue;
    clockedIn.push({
      employeeId: row.employee_id,
      fullName: employeeName(row.employees),
      lastType: attendanceLabel(row.type),
      lastTimestamp: row.timestamp,
    });
  }
  clockedIn.sort((a, b) => a.fullName.localeCompare(b.fullName));

  const { data: recentRows, error: recentError } = await admin
    .from("attendance")
    .select("id, type, timestamp, employees ( full_name )")
    .eq("company_id", companyId)
    .is("voided_at", null)
    .order("timestamp", { ascending: false })
    .limit(10);

  if (recentError) {
    console.error("Dashboard: recent attendance failed", recentError.message);
  }

  const recentAttendance: RecentAttendanceRow[] = (
    (recentRows ?? []) as AttendanceRow[]
  ).map((row) => ({
    id: row.id,
    type: row.type,
    timestamp: row.timestamp,
    fullName: employeeName(row.employees),
  }));

  const weekRange = getDefaultWeekRange(timezone);
  const weekEvents: AttendanceEvent[] = ((weekRows ?? []) as AttendanceRow[]).map(
    (row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: employeeName(row.employees),
      type: row.type,
      timestamp: row.timestamp,
    })
  );
  const weekTimesheetRows = buildTimesheetRows(
    weekEvents,
    timezone,
    weekRange.from,
    weekRange.to
  );
  const weekHours = weekTimesheetRows.reduce(
    (sum, row) => sum + (row.totalHours ?? 0),
    0
  );

  return {
    employeeCount: employeeCount ?? 0,
    todaysClockIns,
    weekHours: Math.round(weekHours * 10) / 10,
    clockedIn,
    recentAttendance,
  };
}
