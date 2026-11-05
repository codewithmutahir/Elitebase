/**
 * Grace-minutes resolver.
 *
 * Centralises the lookup order so kiosk, portal, timesheet export, and
 * backfill all agree on which value wins.
 *
 *   employee override  →  company default  →  hardcoded fallback
 *
 * See AGENTS.md → "Attendance & punctuality policy".
 */

import {
  DEFAULT_GRACE_MINUTES,
  normalizeGraceMinutes,
} from "@/lib/attendance/status";

export type GraceInputs = {
  /** `employees.late_grace_minutes` from the DB (nullable override). */
  employeeOverride?: number | null | undefined;
  /** `companies.late_grace_minutes` from the DB. */
  companyDefault?: number | null | undefined;
};

/**
 * Resolve the effective grace window (in minutes) for a single punch.
 *
 * - Employee override wins when it is a finite number (including 0 = "strict").
 * - Otherwise the company default applies.
 * - If neither is a finite number the hardcoded 15-minute fallback is returned.
 * - All values are clamped to the 0–120 range by `normalizeGraceMinutes`.
 */
export function resolveGraceMinutes(inputs: GraceInputs): number {
  const { employeeOverride, companyDefault } = inputs;

  if (employeeOverride != null && Number.isFinite(employeeOverride)) {
    return normalizeGraceMinutes(employeeOverride);
  }

  if (companyDefault != null && Number.isFinite(companyDefault)) {
    return normalizeGraceMinutes(companyDefault);
  }

  return DEFAULT_GRACE_MINUTES;
}
