import { updateTag } from "next/cache";
import {
  companyAttendanceMonthsTag,
  companyDepartmentsTag,
  companyEmployeeListsTag,
  portalCompanyBenefitsTag,
  portalCompanyLeaveTag,
  portalCompanyPayslipsTag,
  portalEmployeeBenefitsTag,
  portalEmployeeLeaveTag,
  portalEmployeeMonthTag,
  portalEmployeePayslipsTag,
} from "@/lib/cache/tags";

/** Call only from Server Actions (read-your-writes after mutations). */
export function invalidateDepartmentsCache(companyId: string) {
  updateTag(companyDepartmentsTag(companyId));
}

export function invalidateEmployeeListsCache(companyId: string) {
  updateTag(companyEmployeeListsTag(companyId));
}

export function invalidateAttendanceMonthsCache(companyId: string) {
  updateTag(companyAttendanceMonthsTag(companyId));
}

export function invalidatePortalEmployeeMonthCache(
  companyId: string,
  employeeId: string
) {
  updateTag(portalEmployeeMonthTag(companyId, employeeId));
}

export function invalidatePortalEmployeeLeaveCache(
  companyId: string,
  employeeId: string
) {
  updateTag(portalEmployeeLeaveTag(companyId, employeeId));
  updateTag(portalCompanyLeaveTag(companyId));
}

export function invalidatePortalCompanyLeaveCache(companyId: string) {
  updateTag(portalCompanyLeaveTag(companyId));
}

export function invalidatePortalEmployeeBenefitsCache(
  companyId: string,
  employeeId: string
) {
  updateTag(portalEmployeeBenefitsTag(companyId, employeeId));
  updateTag(portalCompanyBenefitsTag(companyId));
}

export function invalidatePortalCompanyBenefitsCache(companyId: string) {
  updateTag(portalCompanyBenefitsTag(companyId));
}

export function invalidatePortalEmployeePayslipsCache(
  companyId: string,
  employeeId: string
) {
  updateTag(portalEmployeePayslipsTag(companyId, employeeId));
  updateTag(portalCompanyPayslipsTag(companyId));
}

export function invalidatePortalCompanyPayslipsCache(companyId: string) {
  updateTag(portalCompanyPayslipsTag(companyId));
}
