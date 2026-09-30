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
