import { formatTime } from "@/lib/dashboard/format";

export function formatPortalHours(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours)) return "—";
  return `${hours.toFixed(2)}h`;
}

export function formatPortalPunch(
  iso: string | null,
  timezone: string
): string {
  if (!iso) return "—";
  return formatTime(iso, timezone);
}

export function formatPortalMonthLabel(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNum - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function portalShiftStatusLabel(
  status: "open" | "complete" | "incomplete",
  opts?: { absent?: boolean; unpaidLeave?: boolean }
): string {
  if (opts?.unpaidLeave) return "Unpaid leave";
  if (opts?.absent) return "Absent";
  switch (status) {
    case "open":
      return "In progress";
    case "incomplete":
      return "Incomplete";
    default:
      return "Complete";
  }
}
