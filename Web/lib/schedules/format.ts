import { toPgTime, toInputTime } from "@/lib/availability/format";

export { toPgTime, toInputTime };

export const SHIFT_PRESET_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#16A34A",
  "#EA580C",
  "#DB2777",
  "#0891B2",
] as const;

export function formatShiftTime12(time: string): string {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours)) return time;

  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  const minuteStr = `:${String(minutes).padStart(2, "0")}`;
  return `${hour12}${minuteStr}${period}`;
}

export function formatShiftTimeRange(start: string, end: string): string {
  return `${formatShiftTime12(start)} - ${formatShiftTime12(end)}`;
}

export function shiftDurationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + (sm || 0);
  let endMins = eh * 60 + (em || 0);
  if (endMins <= startMins) endMins += 24 * 60;
  return (endMins - startMins) / 60;
}

export function formatHours(hours: number): string {
  return hours.toFixed(2);
}

export { formatWages } from "@/lib/money/format";
