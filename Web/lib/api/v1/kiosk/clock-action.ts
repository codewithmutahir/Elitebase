import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import { resolveGraceMinutes } from "@/lib/attendance/grace";
import { companyTimezone } from "@/lib/dashboard/format";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { isAttendanceType } from "@/lib/kiosk/attendance";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";
import { consumeFaceVerifyToken } from "@/lib/kiosk/face-verify-token";
import {
  invokeRecordPunch,
  readIdempotencyKey,
} from "@/lib/kiosk/record-punch";

export const runtime = "nodejs";

type ClockActionBody = {
  employee_id?: string;
  type?: string;
  /** @deprecated Ignored — use face_verify_token from verify-face. */
  face_match_score?: number;
  face_verify_token?: string;
  idempotency_key?: string;
  client_timestamp?: string;
};

function parseClientTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

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

  // Never trust client-supplied face_match_score. Only accept a short-lived
  // server-issued token from a successful verify-face call.
  let faceMatchScore: number | null = null;
  const rawToken = String(body.face_verify_token ?? "").trim();
  if (rawToken) {
    const consumed = consumeFaceVerifyToken(rawToken, {
      employeeId,
      tabletId: tablet.id,
      companyId: tablet.company_id,
    });
    if (!consumed) {
      return jsonError("Invalid or expired face verification. Scan again.", 403);
    }
    faceMatchScore = consumed.score;
  }

  const idempotencyKey = readIdempotencyKey(
    request.headers.get("Idempotency-Key") ??
      request.headers.get("idempotency-key"),
    body.idempotency_key
  );

  const clientTimestamp = parseClientTimestamp(body.client_timestamp);

  const admin = createClient();

  let attendanceStatus: string | null = null;
  if (type === "clock_in") {
    const { data: empSchedule } = await admin
      .from("employees")
      .select("schedule_start_time, late_grace_minutes")
      .eq("id", employeeId)
      .eq("company_id", tablet.company_id)
      .maybeSingle();

    const { data: companyRow } = await admin
      .from("companies")
      .select("timezone, late_grace_minutes")
      .eq("id", tablet.company_id)
      .maybeSingle();

    const scheduleStart =
      (empSchedule?.schedule_start_time as string) ?? "09:00:00";
    const scheduleHm = scheduleStart.trim().slice(0, 5);
    const tz = companyTimezone(companyRow?.timezone);
    const graceMinutes = resolveGraceMinutes({
      employeeOverride: empSchedule?.late_grace_minutes as number | null,
      companyDefault: companyRow?.late_grace_minutes as number | null,
    });

    attendanceStatus = computeAttendanceStatus(
      new Date().toISOString(),
      scheduleHm,
      tz,
      graceMinutes
    );
  }

  const result = await invokeRecordPunch(admin, {
    companyId: tablet.company_id,
    employeeId,
    tabletId: tablet.id,
    type,
    idempotencyKey,
    clientTimestamp,
    faceMatchScore,
    attendanceStatus,
  });

  if ("kind" in result) {
    const { captureServerEvent } = await import(
      "@/lib/analytics/posthog-server"
    );
    const { AnalyticsEvent } = await import("@/lib/analytics/events");
    await captureServerEvent(
      tablet.company_id,
      AnalyticsEvent.punchFailed,
      {
        companyId: tablet.company_id,
        source: "kiosk",
        reason: result.kind,
        type,
      }
    );

    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        {
          code: result.code,
          state: result.state,
          message: result.message,
          error: result.message,
        },
        { status: 409 }
      );
    }
    if (result.kind === "invalid_type") {
      return jsonError(result.message, 400);
    }
    const { reportError } = await import("@/lib/analytics/report-error");
    reportError(new Error(result.message), {
      surface: "kiosk",
      companyId: tablet.company_id,
      route: "/api/v1/kiosk/clock-action",
      extra: { kind: result.kind },
    });
    return jsonError(result.message, 500);
  }

  const { captureServerEvent } = await import(
    "@/lib/analytics/posthog-server"
  );
  const { AnalyticsEvent } = await import("@/lib/analytics/events");
  await captureServerEvent(
    tablet.company_id,
    AnalyticsEvent.punchSucceeded,
    {
      companyId: tablet.company_id,
      source: "kiosk",
      type,
    }
  );

  return jsonOk({
    attendance: result.attendance,
    ...(result.staleShiftDetected ? { stale_shift_detected: true } : {}),
  });
}
