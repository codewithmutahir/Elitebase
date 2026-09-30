/**
 * Active (non-voided) attendance rows.
 * Apply `.is("voided_at", null)` on every attendance SELECT used for pairing, dashboards, and exports.
 */
export function isActiveAttendanceRow(
  voidedAt: string | null | undefined
): boolean {
  return voidedAt == null;
}

export const ACTIVE_ATTENDANCE_FILTER = {
  column: "voided_at" as const,
  operator: "is" as const,
  value: null,
};
