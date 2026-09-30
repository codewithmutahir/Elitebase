import { updateTag } from "next/cache";
import {
  companyAttendanceMonthsTag,
  companyDepartmentsTag,
  companyEmployeeListsTag,
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
