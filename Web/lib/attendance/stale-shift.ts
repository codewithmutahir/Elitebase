/** Default when `companies.stale_shift_hours` is unavailable (matches DB default). */
export const DEFAULT_STALE_SHIFT_HOURS = 16;

export function isStaleOpenShift(
  latestEventTimestamp: string,
  staleShiftHours: number,
  now: Date = new Date()
): boolean {
  if (!Number.isFinite(staleShiftHours) || staleShiftHours <= 0) {
    return false;
  }
  const latestMs = new Date(latestEventTimestamp).getTime();
  if (Number.isNaN(latestMs)) return false;
  const thresholdMs = staleShiftHours * 60 * 60 * 1000;
  return now.getTime() - latestMs > thresholdMs;
}

/** Mirrors record_punch stale clock-in override (in / on_break + clock_in only). */
export function shouldAllowStaleClockIn(
  state: "out" | "in" | "on_break",
  action: string,
  latestEventTimestamp: string | null,
  staleShiftHours: number,
  now: Date = new Date()
): boolean {
  if (action !== "clock_in") return false;
  if (state !== "in" && state !== "on_break") return false;
  if (!latestEventTimestamp) return false;
  return isStaleOpenShift(latestEventTimestamp, staleShiftHours, now);
}
