"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidatePortalEmployeeMonthCache } from "@/lib/cache/invalidate";
import {
  checkPortalRateLimit,
  portalRateLimitMessage,
} from "@/lib/portal/rate-limit";
import { requireEmployeeSession } from "@/lib/portal/session";
import type { TimeOffRequestType } from "@/lib/time-off/queries";

const PORTAL_LEAVE_TYPES: TimeOffRequestType[] = [
  "vacation",
  "sick",
  "personal",
  "unpaid",
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function revalidatePortalLeave(companyId: string, employeeId: string) {
  invalidatePortalEmployeeMonthCache(companyId, employeeId);
  revalidatePath("/portal/leave");
  revalidatePath("/portal");
  revalidatePath("/team/time-off");
}

export async function createPortalLeaveRequest(input: {
  startDate: string;
  endDate: string;
  requestType: string;
  reason?: string | null;
}) {
  const { employee } = await requireEmployeeSession();

  const rate = await checkPortalRateLimit("leave-create", employee.id);
  if (rate.limited) {
    return { error: portalRateLimitMessage(rate.retryAfterSeconds) };
  }

  const admin = createClient();
  const startDate = input.startDate.trim();
  const endDate = (input.endDate.trim() || startDate).trim();
  const requestType = input.requestType.trim() as TimeOffRequestType;

  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
    return { error: "Enter valid start and end dates." };
  }
  if (endDate < startDate) {
    return { error: "End date must be on or after start date." };
  }
  if (!PORTAL_LEAVE_TYPES.includes(requestType)) {
    return { error: "Choose a valid leave type." };
  }

  // Soft dedupe: block overlapping pending/approved requests for the same employee.
  const { data: overlapping, error: overlapError } = await admin
    .from("time_off_requests")
    .select("id")
    .eq("company_id", employee.company_id)
    .eq("employee_id", employee.id)
    .in("status", ["pending", "approved"])
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .limit(1);

  if (overlapError) {
    console.error("createPortalLeaveRequest overlap:", overlapError.message);
    return { error: "Could not submit leave request." };
  }
  if (overlapping?.length) {
    return {
      error:
        "You already have a pending or approved request that overlaps these dates.",
    };
  }

  const { data, error } = await admin
    .from("time_off_requests")
    .insert({
      company_id: employee.company_id,
      employee_id: employee.id,
      start_date: startDate,
      end_date: endDate,
      request_type: requestType,
      reason: input.reason?.trim() || null,
      status: "pending",
      requested_by: "employee",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createPortalLeaveRequest:", error.message);
    return { error: "Could not submit leave request." };
  }

  revalidatePortalLeave(employee.company_id, employee.id);
  return { ok: true as const, id: data.id };
}

/** Employee can cancel their own pending requests only (atomic status guard). */
export async function cancelPortalLeaveRequest(requestId: string) {
  const { employee } = await requireEmployeeSession();

  const rate = await checkPortalRateLimit("leave-cancel", employee.id);
  if (rate.limited) {
    return { error: portalRateLimitMessage(rate.retryAfterSeconds) };
  }

  const admin = createClient();
  const id = requestId.trim();
  if (!id) return { error: "Request not found." };

  const { data: updated, error } = await admin
    .from("time_off_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("company_id", employee.company_id)
    .eq("employee_id", employee.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("cancelPortalLeaveRequest:", error.message);
    return { error: "Could not cancel request." };
  }

  if (!updated?.length) {
    return {
      error:
        "Only pending requests can be cancelled, or this request was already updated.",
    };
  }

  revalidatePortalLeave(employee.company_id, employee.id);
  return { ok: true as const };
}
