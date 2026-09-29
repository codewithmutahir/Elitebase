/**
 * Attendance punctuality logic.
 *
 * Grace period: 15 minutes after scheduled start.
 * - Clock-in within schedule or grace → "on_time"
 * - Clock-in after grace → "late"
 */

const GRACE_MINUTES = 15;

export type AttendancePunctuality = "on_time" | "late";

/**
 * Determine if a clock-in is on time or late relative to the employee schedule.
 *
 * @param clockInTimestamp  ISO timestamp of the clock-in event
 * @param scheduleStart     Time string "HH:MM" (24h)
 * @param timezone          IANA timezone of the company (e.g. "America/New_York")
 */
export function computeAttendanceStatus(
  clockInTimestamp: string,
  scheduleStart: string,
  timezone: string
): AttendancePunctuality {
  const clockIn = new Date(clockInTimestamp);

  const localTime = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(clockIn);

  const [clockHour, clockMinute] = localTime.split(":").map(Number);
  const [schedHour, schedMinute] = scheduleStart.split(":").map(Number);

  const clockTotalMinutes = clockHour * 60 + clockMinute;
  const schedTotalMinutes = schedHour * 60 + schedMinute;
  const graceEnd = schedTotalMinutes + GRACE_MINUTES;

  if (clockTotalMinutes <= graceEnd) {
    return "on_time";
  }

  return "late";
}
