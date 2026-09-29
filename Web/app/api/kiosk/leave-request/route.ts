import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

type LeaveRequestBody = {
  employee_id?: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
};

const VALID_TYPES = ["paid_leave", "unpaid_leave"] as const;

export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const body = await parseJsonBody<LeaveRequestBody>(request);
  if (body instanceof Response) return body;

  const employeeId = String(body.employee_id ?? "").trim();
  const leaveType = String(body.leave_type ?? "").trim();
  const startDate = String(body.start_date ?? "").trim();
  const endDate = String(body.end_date ?? startDate).trim();
  const reason = String(body.reason ?? "").trim() || null;

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (!VALID_TYPES.includes(leaveType as (typeof VALID_TYPES)[number])) {
    return jsonError("leave_type must be paid_leave or unpaid_leave.", 400);
  }

  if (!startDate) {
    return jsonError("start_date is required.", 400);
  }

  if (endDate < startDate) {
    return jsonError("end_date must be on or after start_date.", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  const admin = createClient();

  const { data, error } = await admin
    .from("time_off_requests")
    .insert({
      company_id: tablet.company_id,
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      request_type: leaveType,
      status: "pending",
      reason,
      requested_by: "employee",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("kiosk leave-request failed:", error?.message);
    return jsonError("Could not submit leave request.", 500);
  }

  return jsonOk({ request_id: data.id, status: "pending" });
}
