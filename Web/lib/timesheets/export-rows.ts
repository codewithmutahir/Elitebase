import { createClient } from "@/lib/supabase/server";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import { formatShiftTimeRange } from "@/lib/schedules/format";
import {
  isDateOnApprovedTimeOff,
  listApprovedUnpaidLeaveForRange,
} from "@/lib/time-off/queries";
import { getAllTimesheetRows } from "@/lib/timesheets/data";
import { missingPunchSummary } from "@/lib/timesheets/missing-punches";
import {
  fetchPublishedScheduleSlots,
  type PublishedScheduleSlot,
} from "@/lib/timesheets/scheduled-absent";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type TimesheetExportRow = TimesheetRow & {
  scheduledTime: string;
  onTime: boolean;
  late: boolean;
  absent: boolean;
  missingClockIn: boolean;
  missingClockOut: boolean;
  unpaidLeave: boolean;
  bonusAmount: number;
};

type EmployeeExportMeta = {
  full_name: string;
  schedule_start_time: string;
  schedule_end_time: string;
  bonus_amount: number;
};

type ScheduleSlot = PublishedScheduleSlot;

function pgTimeToHm(value: string) {
  return value.trim().slice(0, 5);
}

function scheduledTimeLabel(
  employeeId: string,
  date: string,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>
): string {
  const shift = schedulesByKey.get(`${employeeId}:${date}`);
  if (shift) {
    return formatShiftTimeRange(
      pgTimeToHm(shift.start_time),
      pgTimeToHm(shift.end_time)
    );
  }
  const employee = employees.get(employeeId);
  if (!employee) return "";
  return formatShiftTimeRange(
    pgTimeToHm(employee.schedule_start_time),
    pgTimeToHm(employee.schedule_end_time)
  );
}

function resolvePunctuality(
  row: TimesheetRow,
  scheduleStartHm: string,
  timezone: string
): { onTime: boolean; late: boolean } {
  if (!row.clockIn) {
    return { onTime: false, late: false };
  }

  const stored = row.clockInAttendanceStatus;
  if (stored === "on_time") return { onTime: true, late: false };
  if (stored === "late") return { onTime: false, late: true };

  const computed = computeAttendanceStatus(
    row.clockIn,
    scheduleStartHm,
    timezone
  );
  return computed === "on_time"
    ? { onTime: true, late: false }
    : { onTime: false, late: true };
}

function scheduleStartHmForRow(
  employeeId: string,
  date: string,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>
): string {
  const shift = schedulesByKey.get(`${employeeId}:${date}`);
  if (shift) return pgTimeToHm(shift.start_time);
  const employee = employees.get(employeeId);
  return employee ? pgTimeToHm(employee.schedule_start_time) : "09:00";
}

function enrichRow(
  row: TimesheetRow,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>,
  unpaidLeave: {
    employee_id: string;
    start_date: string;
    end_date: string;
  }[],
  timezone: string,
  options: { forceAbsent?: boolean }
): TimesheetExportRow {
  const scheduledTime = scheduledTimeLabel(
    row.employeeId,
    row.date,
    employees,
    schedulesByKey
  );
  const scheduleStartHm = scheduleStartHmForRow(
    row.employeeId,
    row.date,
    employees,
    schedulesByKey
  );
  const { onTime, late } = resolvePunctuality(row, scheduleStartHm, timezone);
  const unpaidLeaveDay = isDateOnApprovedTimeOff(
    row.date,
    row.employeeId,
    unpaidLeave
  );
  const absent =
    options.forceAbsent ||
    (!row.clockIn &&
      !unpaidLeaveDay &&
      Boolean(schedulesByKey.get(`${row.employeeId}:${row.date}`)));

  const bonusAmount = employees.get(row.employeeId)?.bonus_amount ?? 0;
  const { missingClockIn, missingClockOut } = missingPunchSummary(row);

  return {
    ...row,
    scheduledTime,
    onTime: row.clockIn ? onTime : false,
    late: row.clockIn ? late : false,
    absent,
    missingClockIn,
    missingClockOut,
    unpaidLeave: unpaidLeaveDay,
    bonusAmount,
  };
}

async function fetchEmployeeExportMeta(
  companyId: string,
  employeeIds: string[]
): Promise<Map<string, EmployeeExportMeta>> {
  if (employeeIds.length === 0) return new Map();

  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, schedule_start_time, schedule_end_time, bonus_amount"
    )
    .eq("company_id", companyId)
    .in("id", employeeIds);

  if (error) {
    console.error("fetchEmployeeExportMeta failed:", error.message);
    return new Map();
  }

  const map = new Map<string, EmployeeExportMeta>();
  for (const row of data ?? []) {
    map.set(row.id as string, {
      full_name: (row.full_name as string) ?? "Unknown",
      schedule_start_time: (row.schedule_start_time as string) ?? "09:00:00",
      schedule_end_time: (row.schedule_end_time as string) ?? "17:00:00",
      bonus_amount: Number(row.bonus_amount ?? 0),
    });
  }
  return map;
}

export async function getTimesheetExportRows(
  companyId: string,
  timezone: string,
  from: string,
  to: string,
  employeeId?: string
): Promise<TimesheetExportRow[]> {
  const baseRows = await getAllTimesheetRows(
    companyId,
    timezone,
    from,
    to,
    employeeId
  );

  const employeeIds = [
    ...new Set(baseRows.map((row) => row.employeeId)),
  ] as string[];

  const schedulesByKey = await fetchPublishedScheduleSlots(
    companyId,
    from,
    to,
    employeeId
  );

  for (const slot of schedulesByKey.values()) {
    if (!employeeIds.includes(slot.employee_id)) {
      employeeIds.push(slot.employee_id);
    }
  }

  const [employees, unpaidLeave] = await Promise.all([
    fetchEmployeeExportMeta(companyId, employeeIds),
    listApprovedUnpaidLeaveForRange(companyId, from, to),
  ]);

  return baseRows.map((row) =>
    enrichRow(row, employees, schedulesByKey, unpaidLeave, timezone, {
      forceAbsent: row.id.startsWith("absent:"),
    })
  );
}
