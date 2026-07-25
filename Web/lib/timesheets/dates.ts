import { dateKeyInTimezone } from "@/lib/dashboard/format";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function formatDateKey(year: number, month: number, day: number) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function addDaysToKey(key: string, days: number) {
  const { year, month, day } = parseDateKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateKey(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function weekdayIndex(date: Date, timezone: string) {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(date);
  return WEEKDAY_INDEX[short] ?? 0;
}

/** Monday–Sunday week containing `reference` in the given timezone. */
export function getDefaultWeekRange(
  timezone: string,
  reference = new Date()
): { from: string; to: string } {
  const todayKey = dateKeyInTimezone(reference, timezone);
  const mondayOffset = (weekdayIndex(reference, timezone) + 6) % 7;
  const from = addDaysToKey(todayKey, -mondayOffset);
  const to = addDaysToKey(from, 6);
  return { from, to };
}

export function parseDateRange(
  timezone: string,
  fromInput?: string,
  toInput?: string
) {
  const defaults = getDefaultWeekRange(timezone);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromInput ?? "")
    ? (fromInput as string)
    : defaults.from;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(toInput ?? "")
    ? (toInput as string)
    : defaults.to;

  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

/** Wider UTC window so edge timestamps still fall in the company-local range. */
export function queryWindowIso(from: string, to: string) {
  const start = new Date(`${from}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${to}T23:59:59.999Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function isDateInRange(
  dateKey: string,
  from: string,
  to: string
) {
  return dateKey >= from && dateKey <= to;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  let hour = Number(map.hour);
  // Some engines emit "24" for midnight
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** HH:mm in the given IANA timezone for an ISO timestamp. */
export function isoToLocalTimeHm(iso: string, timeZone: string): string {
  const parts = getZonedParts(new Date(iso), timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

/**
 * Convert company-local YYYY-MM-DD + HH:mm to a UTC ISO timestamp.
 * Iteratively corrects for timezone offset (handles DST for common cases).
 */
export function zonedLocalToUtcIso(
  dateKey: string,
  timeHm: string,
  timeZone: string
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  if (!/^\d{2}:\d{2}$/.test(timeHm)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = timeHm.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i++) {
    const parts = getZonedParts(new Date(utcGuess), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      0
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = desired - asUtc;
    utcGuess += diff;
    if (diff === 0) break;
  }

  return new Date(utcGuess).toISOString();
}
