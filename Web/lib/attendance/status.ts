/**
 * Attendance punctuality logic.
 *
 * Grace period is configurable per-company (and optionally per-employee).
 * Resolution order at call sites:
 *   employees.late_grace_minutes
 *   ?? companies.late_grace_minutes
 *   ?? DEFAULT_GRACE_MINUTES
 *
 * See AGENTS.md → "Attendance & punctuality policy" for the rule of record.
 *
 * - Clock-in at/before scheduled start + grace → "on_time"
 * - Clock-in after scheduled start + grace     → "late"
 */

/** Fallback used when no company/employee value is available. */
export const DEFAULT_GRACE_MINUTES = 15;

/** Allowed range for grace minutes, matches DB check constraints. */
export const MIN_GRACE_MINUTES = 0;
export const MAX_GRACE_MINUTES = 120;

export type AttendancePunctuality = "on_time" | "late";

/**
 * Clamp any input to the valid 0–120 range; non-finite / nullish → default.
 * Kept here so every call site goes through the same guard.
 */
export function normalizeGraceMinutes(
  value: number | null | undefined
): number {
  if (value == null || !Number.isFinite(value)) return DEFAULT_GRACE_MINUTES;
  const trunc = Math.trunc(value);
  if (trunc < MIN_GRACE_MINUTES) return MIN_GRACE_MINUTES;
  if (trunc > MAX_GRACE_MINUTES) return MAX_GRACE_MINUTES;
  return trunc;
}

/**
 * Determine if a clock-in is on time or late relative to the employee schedule.
 *
 * @param clockInTimestamp  ISO timestamp of the clock-in event
 * @param scheduleStart     Time string "HH:MM" (24h)
 * @param timezone          IANA timezone of the company (e.g. "America/New_York")
 * @param graceMinutes      Minutes after scheduled start still counted as on-time.
 *                          Defaults to DEFAULT_GRACE_MINUTES (15) when omitted so
 *                          legacy call sites behave exactly as before.
 */
export function computeAttendanceStatus(
  clockInTimestamp: string,
  scheduleStart: string,
  timezone: string,
  graceMinutes: number | null | undefined = DEFAULT_GRACE_MINUTES
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
  const grace = normalizeGraceMinutes(graceMinutes);
  const graceEnd = schedTotalMinutes + grace;

  if (clockTotalMinutes <= graceEnd) {
    return "on_time";
  }

  return "late";
}
