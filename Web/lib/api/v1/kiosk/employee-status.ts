import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { isEmployeeClockedIn } from "@/lib/kiosk/attendance";
import {
  getEmployeeForTablet,
  getLatestAttendanceType,
} from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

type EmployeeStatusBody = {
  employee_id?: string;
};

export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const body = await parseJsonBody<EmployeeStatusBody>(request);
  if (body instanceof Response) return body;

  const employeeId = String(body.employee_id ?? "").trim();
  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  const latestType = await getLatestAttendanceType(
    tablet.company_id,
    employeeId
  );

  const clockedIn = isEmployeeClockedIn(latestType);
  const onBreak = latestType === "break_start";

  let clockedInAt: string | null = null;
  if (clockedIn) {
    const admin = createClient();
    const { data: inEvent } = await admin
      .from("attendance")
      .select("timestamp")
      .eq("company_id", tablet.company_id)
      .eq("employee_id", employeeId)
      .in("type", ["clock_in", "break_end"])
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    clockedInAt = inEvent?.timestamp ?? null;
  }

  return jsonOk({
    employee_id: employeeId,
    is_clocked_in: clockedIn,
    clocked_in: clockedIn,
    clocked_in_at: clockedInAt,
    on_break: onBreak,
    latest_type: latestType,
  });
}
