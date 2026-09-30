import { dateKeyInTimezone } from "@/lib/dashboard/format";
import { isDateInRange } from "@/lib/timesheets/dates";

export type AttendanceEvent = {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  timestamp: string;
  /** Set on clock_in rows when stored by kiosk/API. */
  attendance_status?: string | null;
  review_flag?: string | null;
};

export type TimesheetRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  /** Shift start date (clock-in local date). */
  date: string;
  /** Local date of clock-out when it falls on a different calendar day than `date`. */
  clockOutDate: string | null;
  clockIn: string | null;
  clockOut: string | null;
  clockInEventId: string | null;
  clockOutEventId: string | null;
  totalHours: number | null;
  breakHours: number | null;
  breakCount: number;
  status: "open" | "complete" | "incomplete";
  clockInAttendanceStatus: string | null;
  /** True when any punch in this shift has review_flag = needs_review. */
  needsReview: boolean;
};

function computeBreakMs(events: AttendanceEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let breakMs = 0;
  let breakCount = 0;
  let breakStartMs: number | null = null;
  let clockInMs: number | null = null;

  for (const event of sorted) {
    const t = new Date(event.timestamp).getTime();

    switch (event.type) {
      case "clock_in":
        clockInMs = t;
        breakStartMs = null;
        break;
      case "break_start":
        if (clockInMs !== null) {
          breakStartMs = t;
        }
        break;
      case "break_end":
        if (breakStartMs !== null) {
          breakMs += t - breakStartMs;
          breakCount += 1;
          breakStartMs = null;
          clockInMs = t;
        }
        break;
      case "clock_out":
        clockInMs = null;
        breakStartMs = null;
        break;
      default:
        break;
    }
  }

  return { breakMs, breakCount };
}

function computeWorkedMs(events: AttendanceEvent[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let workedMs = 0;
  let clockInMs: number | null = null;
  let breakStartMs: number | null = null;

  for (const event of sorted) {
    const t = new Date(event.timestamp).getTime();

    switch (event.type) {
      case "clock_in":
        clockInMs = t;
        breakStartMs = null;
        break;
      case "break_start":
        if (clockInMs !== null) {
          breakStartMs = t;
        }
        break;
      case "break_end":
        if (clockInMs !== null && breakStartMs !== null) {
          workedMs += breakStartMs - clockInMs;
          clockInMs = t;
          breakStartMs = null;
        }
        break;
      case "clock_out":
        if (clockInMs !== null) {
          workedMs += t - clockInMs;
          clockInMs = null;
          breakStartMs = null;
        }
        break;
      default:
        break;
    }
  }

  return workedMs;
}

function firstEvent(events: AttendanceEvent[], type: string) {
  return events.find((event) => event.type === type) ?? null;
}

function lastEvent(events: AttendanceEvent[], type: string) {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === type) return events[i];
  }
  return null;
}

function shiftRowFromEvents(
  shiftEvents: AttendanceEvent[],
  timezone: string,
  rowId: string
): TimesheetRow | null {
  if (shiftEvents.length === 0) return null;

  const employeeId = shiftEvents[0].employee_id;
  const employeeName = shiftEvents[0].employee_name ?? "Unknown";
  const clockInEvent = firstEvent(shiftEvents, "clock_in");
  const clockOutEvent = lastEvent(shiftEvents, "clock_out");

  const date = clockInEvent
    ? dateKeyInTimezone(new Date(clockInEvent.timestamp), timezone)
    : clockOutEvent
      ? dateKeyInTimezone(new Date(clockOutEvent.timestamp), timezone)
      : "";

  if (!date) return null;

  const clockOutLocalDate = clockOutEvent
    ? dateKeyInTimezone(new Date(clockOutEvent.timestamp), timezone)
    : null;
  const clockOutDate =
    clockOutLocalDate && clockOutLocalDate !== date ? clockOutLocalDate : null;

  const open = Boolean(clockInEvent) && !clockOutEvent;

  const workedMs = computeWorkedMs(shiftEvents);
  const { breakMs, breakCount } = computeBreakMs(shiftEvents);
  const totalHours =
    workedMs > 0 ? Math.round((workedMs / 3_600_000) * 100) / 100 : null;
  const breakHours =
    breakMs > 0 ? Math.round((breakMs / 3_600_000) * 100) / 100 : null;

  let status: TimesheetRow["status"] = "incomplete";
  if (open) {
    status = "open";
  } else if (clockInEvent && clockOutEvent) {
    status = "complete";
  }

  return {
    id: rowId,
    employeeId,
    employeeName,
    date,
    clockOutDate,
    clockIn: clockInEvent?.timestamp ?? null,
    clockOut: open ? null : clockOutEvent?.timestamp ?? null,
    clockInEventId: clockInEvent?.id ?? null,
    clockOutEventId: open ? null : clockOutEvent?.id ?? null,
    totalHours: open ? null : totalHours,
    breakHours: open ? null : breakHours,
    breakCount,
    status,
    clockInAttendanceStatus: clockInEvent?.attendance_status ?? null,
    needsReview: shiftEvents.some(
      (event) => event.review_flag === "needs_review"
    ),
  };
}

/** Pair punches into logical shifts (clock-in date = row date). */
function buildEmployeeShiftRows(
  events: AttendanceEvent[],
  timezone: string
): TimesheetRow[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const rows: TimesheetRow[] = [];
  let buffer: AttendanceEvent[] = [];
  let shiftIndex = 0;

  function flushOpenShift() {
    if (buffer.length === 0) return;
    const clockInEvent = firstEvent(buffer, "clock_in");
    const rowId = clockInEvent
      ? `${clockInEvent.employee_id}:in:${clockInEvent.id}`
      : `${buffer[0].employee_id}:shift:${shiftIndex}`;
    const row = shiftRowFromEvents(buffer, timezone, rowId);
    if (row) rows.push(row);
    buffer = [];
    shiftIndex += 1;
  }

  for (const event of sorted) {
    switch (event.type) {
      case "clock_in": {
        if (buffer.some((item) => item.type === "clock_in")) {
          flushOpenShift();
        }
        buffer.push(event);
        break;
      }
      case "clock_out": {
        if (buffer.some((item) => item.type === "clock_in")) {
          buffer.push(event);
          flushOpenShift();
        } else {
          const rowId = `${event.employee_id}:out:${event.id}`;
          const row = shiftRowFromEvents([event], timezone, rowId);
          if (row) rows.push(row);
          shiftIndex += 1;
        }
        break;
      }
      case "break_start":
      case "break_end":
        if (buffer.some((item) => item.type === "clock_in")) {
          buffer.push(event);
        }
        break;
      default:
        break;
    }
  }

  flushOpenShift();
  return rows;
}

export function buildTimesheetRows(
  events: AttendanceEvent[],
  timezone: string,
  from: string,
  to: string
): TimesheetRow[] {
  const byEmployee = new Map<string, AttendanceEvent[]>();

  for (const event of events) {
    const bucket = byEmployee.get(event.employee_id) ?? [];
    bucket.push(event);
    byEmployee.set(event.employee_id, bucket);
  }

  const rows: TimesheetRow[] = [];

  for (const employeeEvents of byEmployee.values()) {
    rows.push(...buildEmployeeShiftRows(employeeEvents, timezone));
  }

  const filtered = rows.filter((row) => isDateInRange(row.date, from, to));

  filtered.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.employeeName.localeCompare(b.employeeName);
  });

  return filtered;
}
