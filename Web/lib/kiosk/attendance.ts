export type AttendanceType =
  | "clock_in"
  | "clock_out"
  | "break_start"
  | "break_end";

const ATTENDANCE_TYPES: AttendanceType[] = [
  "clock_in",
  "clock_out",
  "break_start",
  "break_end",
];

export function isAttendanceType(value: string): value is AttendanceType {
  return ATTENDANCE_TYPES.includes(value as AttendanceType);
}

export function isEmployeeClockedIn(latestType: string | null | undefined) {
  return latestType === "clock_in" || latestType === "break_end";
}
