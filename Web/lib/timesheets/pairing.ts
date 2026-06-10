import { dateKeyInTimezone } from "@/lib/dashboard/format";
import { isDateInRange } from "@/lib/timesheets/dates";
import { isEmployeeClockedIn } from "@/lib/kiosk/attendance";

export type AttendanceEvent = {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  timestamp: string;
};

export type TimesheetRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
  status: "open" | "complete" | "incomplete";
};

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

export function buildTimesheetRows(
  events: AttendanceEvent[],
  timezone: string,
  from: string,
  to: string
): TimesheetRow[] {
  const groups = new Map<string, AttendanceEvent[]>();

  for (const event of events) {
    const date = dateKeyInTimezone(new Date(event.timestamp), timezone);
    if (!isDateInRange(date, from, to)) continue;

    const key = `${event.employee_id}:${date}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  const rows: TimesheetRow[] = [];

  for (const [key, dayEvents] of groups) {
    const [employeeId, date] = key.split(":");
    const employeeName = dayEvents[0]?.employee_name ?? "Unknown";
    const clockInEvent = firstEvent(dayEvents, "clock_in");
    const clockOutEvent = lastEvent(dayEvents, "clock_out");
    const latestType = [...dayEvents].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0]?.type;

    const open = isEmployeeClockedIn(latestType);
    const workedMs = computeWorkedMs(dayEvents);
    const totalHours =
      workedMs > 0 ? Math.round((workedMs / 3_600_000) * 100) / 100 : null;

    let status: TimesheetRow["status"] = "incomplete";
    if (open) {
      status = "open";
    } else if (clockInEvent && clockOutEvent) {
      status = "complete";
    }

    rows.push({
      id: key,
      employeeId,
      employeeName,
      date,
      clockIn: clockInEvent?.timestamp ?? null,
      clockOut: open ? null : clockOutEvent?.timestamp ?? null,
      totalHours: open ? null : totalHours,
      status,
    });
  }

  rows.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.employeeName.localeCompare(b.employeeName);
  });

  return rows;
}
