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

import { isClockedInForStatus } from "@/lib/attendance/attendance-state";

export function isEmployeeClockedIn(latestType: string | null | undefined) {
  return isClockedInForStatus(latestType);
}
