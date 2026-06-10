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
