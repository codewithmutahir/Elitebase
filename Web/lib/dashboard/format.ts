import { DEFAULT_TIMEZONE } from "@/lib/timezones";

export function companyTimezone(timezone: string | null | undefined) {
  return timezone?.trim() || DEFAULT_TIMEZONE;
}

/** YYYY-MM-DD in the given IANA timezone (en-CA locale). */
export function dateKeyInTimezone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function attendanceLabel(type: string) {
  switch (type) {
    case "clock_in":
      return "Clock in";
    case "clock_out":
      return "Clock out";
    case "break_start":
      return "Break start";
    case "break_end":
      return "Break end";
    default:
      return type;
  }
}
