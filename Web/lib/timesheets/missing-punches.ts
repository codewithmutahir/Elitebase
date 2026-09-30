import type { TimesheetRow } from "@/lib/timesheets/pairing";

export function isMissingClockIn(row: TimesheetRow): boolean {
  return !row.clockIn;
}

export function isMissingClockOut(row: TimesheetRow): boolean {
  return Boolean(row.clockIn) && !row.clockOut;
}

export type MissingPunchSummary = {
  missingClockIn: boolean;
  missingClockOut: boolean;
};

export function missingPunchSummary(row: TimesheetRow): MissingPunchSummary {
  return {
    missingClockIn: isMissingClockIn(row),
    missingClockOut: isMissingClockOut(row),
  };
}
