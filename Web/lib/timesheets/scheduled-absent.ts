import { createClient } from "@/lib/supabase/server";
import {
  isWorkingDayOnDate,
  normalizeWorkingDays,
} from "@/lib/employees/working-days";
import {
  isDateOnApprovedTimeOff,
  listApprovedTimeOffForRange,
} from "@/lib/time-off/queries";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type PublishedScheduleSlot = {
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  employee_name: string;
};

export type EmployeeAbsentMeta = {
  id: string;
  full_name: string;
  working_days: number[];
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

function absentRowKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

function makeAbsentRow(
  employeeId: string,
  date: string,
  employeeName: string
): TimesheetRow {
  return {
    id: `absent:${employeeId}:${date}`,
    employeeId,
    employeeName,
    date,
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
  };
}

/** Inclusive YYYY-MM-DD dates from `from` through `to`. */
export function enumerateDateKeys(from: string, to: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${from}T12:00:00.000Z`);
  const end = new Date(`${to}T12:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }
  for (
    let cursor = start;
    cursor.getTime() <= end.getTime();
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
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

export async function fetchEmployeesForAbsentDetection(
  companyId: string,
  employeeId?: string
): Promise<EmployeeAbsentMeta[]> {
  const admin = createClient();
  let query = admin
    .from("employees")
    .select("id, full_name, working_days, status, is_active")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .eq("status", "active");

  if (employeeId) {
    query = query.eq("id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchEmployeesForAbsentDetection failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    full_name: String(row.full_name ?? "Unknown"),
    working_days: normalizeWorkingDays(
      (row.working_days as number[] | null) ?? [1, 2, 3, 4, 5]
    ),
  }));
}

/**
 * Build absent rows for any scheduled/working day with no clock-in and no
 * approved time off. See AGENTS.md → "Absent — default, not opt-in".
 */
export function buildDefaultAbsentRows(
  baseRows: TimesheetRow[],
  schedulesByKey: Map<string, PublishedScheduleSlot>,
  employees: EmployeeAbsentMeta[],
  approvedLeave: {
    employee_id: string;
    start_date: string;
    end_date: string;
  }[],
  from: string,
  to: string
): TimesheetRow[] {
  const absentRows: TimesheetRow[] = [];
  const seen = new Set<string>();
  const employeeNames = new Map<string, string>();

  for (const emp of employees) {
    employeeNames.set(emp.id, emp.full_name);
  }
  for (const row of baseRows) {
    employeeNames.set(row.employeeId, row.employeeName);
  }
  for (const slot of schedulesByKey.values()) {
    employeeNames.set(slot.employee_id, slot.employee_name);
  }

  const dates = enumerateDateKeys(from, to);

  for (const emp of employees) {
    for (const date of dates) {
      const key = absentRowKey(emp.id, date);
      if (seen.has(key)) continue;

      if (hasClockInOnDate(baseRows, emp.id, date)) continue;
      if (isDateOnApprovedTimeOff(date, emp.id, approvedLeave)) continue;

      const hasPublished = schedulesByKey.has(key);
      const onWorkingDay = isWorkingDayOnDate(emp.working_days, date);
      if (!hasPublished && !onWorkingDay) continue;

      seen.add(key);
      absentRows.push(
        makeAbsentRow(
          emp.id,
          date,
          employeeNames.get(emp.id) ?? emp.full_name
        )
      );
    }
  }

  return absentRows;
}

/** @deprecated Use buildDefaultAbsentRows — kept for tests referencing schedule-only path. */
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
  const [schedulesByKey, employees, approvedLeave] = await Promise.all([
    fetchPublishedScheduleSlots(companyId, from, to, employeeId),
    fetchEmployeesForAbsentDetection(companyId, employeeId),
    listApprovedTimeOffForRange(companyId, from, to),
  ]);

  const absentRows = buildDefaultAbsentRows(
    baseRows,
    schedulesByKey,
    employees,
    approvedLeave,
    from,
    to
  );

  return sortTimesheetRowsNewestFirst([...baseRows, ...absentRows]);
}
