import { createClient } from "@/lib/supabase/server";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type PublishedScheduleSlot = {
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  employee_name: string;
};

function hasClockInOnDate(
  rows: TimesheetRow[],
  employeeId: string,
  date: string
) {
  return rows.some(
    (row) =>
      row.employeeId === employeeId && row.date === date && Boolean(row.clockIn)
  );
}

export async function fetchPublishedScheduleSlots(
  companyId: string,
  from: string,
  to: string,
  employeeId?: string
): Promise<Map<string, PublishedScheduleSlot>> {
  const admin = createClient();
  let query = admin
    .from("schedules")
    .select(
      "employee_id, shift_date, start_time, end_time, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .eq("status", "published")
    .gte("shift_date", from)
    .lte("shift_date", to)
    .not("employee_id", "is", null);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchPublishedScheduleSlots failed:", error.message);
    return new Map();
  }

  const map = new Map<string, PublishedScheduleSlot>();
  for (const row of data ?? []) {
    const employee_id = row.employee_id as string;
    const shift_date = row.shift_date as string;
    const employees = row.employees as
      | { full_name: string }
      | { full_name: string }[]
      | null;
    const name = Array.isArray(employees)
      ? employees[0]?.full_name
      : employees?.full_name;

    map.set(`${employee_id}:${shift_date}`, {
      employee_id,
      shift_date,
      start_time: row.start_time as string,
      end_time: row.end_time as string,
      employee_name: name ?? "Unknown",
    });
  }
  return map;
}

export function buildAbsentRowsForPublishedSchedules(
  baseRows: TimesheetRow[],
  schedulesByKey: Map<string, PublishedScheduleSlot>,
  employeeNames: Map<string, string>
): TimesheetRow[] {
  const absentRows: TimesheetRow[] = [];

  for (const slot of schedulesByKey.values()) {
    if (hasClockInOnDate(baseRows, slot.employee_id, slot.shift_date)) {
      continue;
    }

    absentRows.push({
      id: `absent:${slot.employee_id}:${slot.shift_date}`,
      employeeId: slot.employee_id,
      employeeName:
        employeeNames.get(slot.employee_id) ?? slot.employee_name,
      date: slot.shift_date,
      clockOutDate: null,
      clockIn: null,
      clockOut: null,
      clockInEventId: null,
      clockOutEventId: null,
      totalHours: null,
      breakHours: null,
      breakCount: 0,
      status: "incomplete",
      clockInAttendanceStatus: null,
      needsReview: false,
    });
  }

  return absentRows;
}

export function sortTimesheetRowsNewestFirst(rows: TimesheetRow[]): TimesheetRow[] {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.employeeName.localeCompare(b.employeeName, "en", {
      sensitivity: "base",
    });
  });
}

export async function mergeTimesheetRowsWithScheduledAbsences(
  companyId: string,
  from: string,
  to: string,
  baseRows: TimesheetRow[],
  employeeId?: string
): Promise<TimesheetRow[]> {
  const schedulesByKey = await fetchPublishedScheduleSlots(
    companyId,
    from,
    to,
    employeeId
  );

  const employeeNames = new Map<string, string>();
  for (const row of baseRows) {
    employeeNames.set(row.employeeId, row.employeeName);
  }
  for (const slot of schedulesByKey.values()) {
    if (!employeeNames.has(slot.employee_id)) {
      employeeNames.set(slot.employee_id, slot.employee_name);
    }
  }

  const absentRows = buildAbsentRowsForPublishedSchedules(
    baseRows,
    schedulesByKey,
    employeeNames
  );

  return sortTimesheetRowsNewestFirst([...baseRows, ...absentRows]);
}
