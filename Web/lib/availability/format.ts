import type { AvailabilitySlot } from "@/lib/availability/queries";

export type CellDisplayState = "available" | "unavailable" | "partial";

export function getCellDisplayState(
  slot: AvailabilitySlot | undefined
): CellDisplayState {
  if (!slot) return "available";
  if (!slot.is_available) return "unavailable";
  if (slot.start_time && slot.end_time) return "partial";
  return "available";
}

export function formatTime12(time: string): string {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours)) return time;

  const period = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  if (minutes === 0) return `${hour12}${period}`;
  return `${hour12}:${String(minutes).padStart(2, "0")}${period}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)}-${formatTime12(end)}`;
}

export function cellDisplayLabel(slot: AvailabilitySlot | undefined): string {
  const state = getCellDisplayState(slot);
  if (state === "unavailable") return "Unavailable";
  if (state === "partial" && slot?.start_time && slot?.end_time) {
    return formatTimeRange(slot.start_time, slot.end_time);
  }
  return "";
}

export function cellExportLabel(slot: AvailabilitySlot | undefined): string {
  const state = getCellDisplayState(slot);
  if (state === "unavailable") return "Unavailable";
  if (state === "partial" && slot?.start_time && slot?.end_time) {
    return formatTimeRange(slot.start_time, slot.end_time);
  }
  return "Available";
}

/** Normalize HTML time input (HH:mm) to Postgres time string. */
export function toPgTime(value: string): string {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
}

/** Postgres time → HTML time input value. */
export function toInputTime(pgTime: string | null): string {
  if (!pgTime) return "09:00";
  return pgTime.slice(0, 5);
}
