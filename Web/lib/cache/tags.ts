/** Next.js `unstable_cache` tags — scoped per company. */

export function companyDepartmentsTag(companyId: string) {
  return `company:${companyId}:departments`;
}

export function companyEmployeeListsTag(companyId: string) {
  return `company:${companyId}:employee-lists`;
}

export function companyAttendanceMonthsTag(companyId: string) {
  return `company:${companyId}:attendance-months`;
}

/** Employee portal month summary (hours / pay / attendance table). */
export function portalEmployeeMonthTag(
  companyId: string,
  employeeId: string
) {
  return `portal:${companyId}:employee:${employeeId}:months`;
}
