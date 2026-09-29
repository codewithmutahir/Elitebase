import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { isAttendanceType } from "@/lib/kiosk/attendance";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

type ClockActionBody = {
  employee_id?: string;
  type?: string;
  face_match_score?: number;
};

export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const body = await parseJsonBody<ClockActionBody>(request);
  if (body instanceof Response) return body;

  const employeeId = String(body.employee_id ?? "").trim();
  const type = String(body.type ?? "").trim();

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (!isAttendanceType(type)) {
    return jsonError(
      "type must be clock_in, clock_out, break_start, or break_end.",
      400
    );
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  const faceMatchScore =
    typeof body.face_match_score === "number" &&
    !Number.isNaN(body.face_match_score)
      ? body.face_match_score
      : null;

  const timestamp = new Date().toISOString();
  const admin = createClient();

  let attendanceStatus: string | null = null;
  if (type === "clock_in") {
    const { data: empSchedule } = await admin
      .from("employees")
      .select("schedule_start_time")
      .eq("id", employeeId)
      .eq("company_id", tablet.company_id)
      .maybeSingle();

    const { data: companyRow } = await admin
      .from("companies")
      .select("timezone")
      .eq("id", tablet.company_id)
      .maybeSingle();

    const scheduleStart = (empSchedule?.schedule_start_time as string) ?? "09:00";
    const tz = companyRow?.timezone ?? "America/New_York";

    attendanceStatus = computeAttendanceStatus(timestamp, scheduleStart, tz);
  }

  const { data, error } = await admin
    .from("attendance")
    .insert({
      employee_id: employeeId,
      company_id: tablet.company_id,
      tablet_id: tablet.id,
      type,
      timestamp,
      face_match_score: faceMatchScore,
      attendance_status: attendanceStatus,
    })
    .select("id, type, timestamp, attendance_status")
    .single();

  if (error || !data) {
    console.error("clock-action failed:", error?.message);
    return jsonError("Could not record attendance.", 500);
  }

  return jsonOk({
    attendance: {
      id: data.id,
      employee_id: employeeId,
      type: data.type,
      timestamp: data.timestamp,
      attendance_status: data.attendance_status,
    },
  });
}
