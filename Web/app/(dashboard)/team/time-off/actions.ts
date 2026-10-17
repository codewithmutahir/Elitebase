"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  invalidatePortalCompanyLeaveCache,
  invalidatePortalEmployeeLeaveCache,
  invalidatePortalEmployeeMonthCache,
} from "@/lib/cache/invalidate";
import { requireCompanySession } from "@/lib/employees/session";
import type { TimeOffRequestType } from "@/lib/time-off/queries";

const TIME_OFF_PATH = "/team/time-off";

const REQUEST_TYPES: TimeOffRequestType[] = [
  "vacation",
  "sick",
  "personal",
  "unpaid",
  "paid_leave",
  "unpaid_leave",
];

function revalidateTimeOff(companyId: string, employeeId?: string) {
  if (employeeId) {
    invalidatePortalEmployeeLeaveCache(companyId, employeeId);
    invalidatePortalEmployeeMonthCache(companyId, employeeId);
  } else {
    invalidatePortalCompanyLeaveCache(companyId);
  }
  revalidatePath(TIME_OFF_PATH);
  revalidatePath("/schedule/schedule");
  revalidatePath("/portal/leave");
  revalidatePath("/portal");
  revalidatePath("/portal/attendance");
  revalidatePath("/portal/pay");
}

export type CreateTimeOffInput = {
  employeeId: string;
  startDate: string;
  endDate: string;
  requestType: TimeOffRequestType;
  reason?: string | null;
};

export async function createTimeOffRequest(input: CreateTimeOffInput) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  if (!input.employeeId) return { error: "Employee is required." };
  if (!input.startDate || !input.endDate) {
    return { error: "Start and end dates are required." };
  }
  if (input.endDate < input.startDate) {
    return { error: "End date must be on or after start date." };
  }
  if (!REQUEST_TYPES.includes(input.requestType)) {
    return { error: "Invalid request type." };
  }

  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("id", input.employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!employee) return { error: "Employee not found." };

  const { data, error } = await admin
    .from("time_off_requests")
    .insert({
      company_id: company.id,
      employee_id: input.employeeId,
      start_date: input.startDate,
      end_date: input.endDate,
      request_type: input.requestType,
      reason: input.reason?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createTimeOffRequest failed:", error.message);
    return { error: "Could not create time-off request." };
  }

  revalidateTimeOff(company.id, input.employeeId);
  return { id: data.id };
}

export async function reviewTimeOffRequest(
  requestId: string,
  decision: "approved" | "denied"
) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: existing } = await admin
    .from("time_off_requests")
    .select("id, status, employee_id")
    .eq("id", requestId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!existing) return { error: "Request not found." };
  if (existing.status !== "pending") {
    return { error: "Only pending requests can be reviewed." };
  }

  const { error } = await admin
    .from("time_off_requests")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("company_id", company.id);

  if (error) {
    console.error("reviewTimeOffRequest failed:", error.message);
    return { error: "Could not update request." };
  }

  revalidateTimeOff(company.id, existing.employee_id);
  return { ok: true };
}

export async function cancelTimeOffRequest(requestId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: existing } = await admin
    .from("time_off_requests")
    .select("id, status, employee_id")
    .eq("id", requestId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!existing) return { error: "Request not found." };
  if (existing.status !== "pending" && existing.status !== "approved") {
    return { error: "This request cannot be cancelled." };
  }

  const { error } = await admin
    .from("time_off_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("company_id", company.id);

  if (error) {
    console.error("cancelTimeOffRequest failed:", error.message);
    return { error: "Could not cancel request." };
  }

  revalidateTimeOff(company.id, existing.employee_id);
  return { ok: true };
}
