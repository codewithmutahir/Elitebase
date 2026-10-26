"use server";

import { revalidatePath } from "next/cache";
import {
  invalidatePortalCompanyLeaveCache,
  invalidatePortalEmployeeLeaveCache,
} from "@/lib/cache/invalidate";
import { requireCompanySession } from "@/lib/employees/session";
import { adjustLeaveBalance } from "@/lib/leave-balance/service";

export async function adjustEmployeeLeaveBalance(input: {
  employeeId: string;
  year: number;
  bucket: "sick" | "paid";
  field: "total" | "used";
  delta: number;
  reason: string;
}) {
  const { company, userId } = await requireCompanySession();
  const employeeId = input.employeeId?.trim();
  if (!employeeId) return { error: "Employee is required." };

  const result = await adjustLeaveBalance({
    companyId: company.id,
    employeeId,
    year: input.year,
    bucket: input.bucket,
    field: input.field,
    delta: input.delta,
    reason: input.reason,
    actorUid: userId,
  });

  if (!result.ok) return { error: result.error };

  invalidatePortalEmployeeLeaveCache(company.id, employeeId);
  invalidatePortalCompanyLeaveCache(company.id);
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/team/time-off");
  revalidatePath("/portal/leave");
  return { ok: true as const };
}
