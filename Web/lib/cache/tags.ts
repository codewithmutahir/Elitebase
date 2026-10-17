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

/** Portal leave list for one employee. */
export function portalEmployeeLeaveTag(
  companyId: string,
  employeeId: string
) {
  return `portal:${companyId}:employee:${employeeId}:leave`;
}

/** Company-wide portal leave invalidation (employer review / create). */
export function portalCompanyLeaveTag(companyId: string) {
  return `portal:${companyId}:leave`;
}

/** Portal benefits for one employee. */
export function portalEmployeeBenefitsTag(
  companyId: string,
  employeeId: string
) {
  return `portal:${companyId}:employee:${employeeId}:benefits`;
}

/** Company-wide portal benefits invalidation. */
export function portalCompanyBenefitsTag(companyId: string) {
  return `portal:${companyId}:benefits`;
}

/** Portal payslips for one employee. */
export function portalEmployeePayslipsTag(
  companyId: string,
  employeeId: string
) {
  return `portal:${companyId}:employee:${employeeId}:payslips`;
}

/** Company-wide portal payslips invalidation. */
export function portalCompanyPayslipsTag(companyId: string) {
  return `portal:${companyId}:payslips`;
}
