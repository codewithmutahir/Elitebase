import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import {
  isClockedInForStatus,
  isOnBreakForStatus,
} from "@/lib/attendance/attendance-state";
import { companyTimezone } from "@/lib/dashboard/format";
import { parseStoredDescriptor } from "@/lib/kiosk/face";
import {
  classifyServiceFailureReason,
  isPreBuffaloScEnrollment,
} from "@/lib/kiosk/face-verify-instrumentation";
import { getLatestAttendanceType } from "@/lib/kiosk/employee-lookup";
import {
  FaceServiceUnavailableError,
  getPythonFaceServiceUrl,
  verifyFaceWithService,
} from "@/lib/kiosk/python-face-service";
import { recordFaceVerifyAttempt } from "@/lib/kiosk/record-face-verify-attempt";
import { invokeRecordPunch } from "@/lib/kiosk/record-punch";
import type { AttendanceType } from "@/lib/kiosk/attendance";
import { isAttendanceType } from "@/lib/kiosk/attendance";
import {
  isValidLatLng,
  matchGeofence,
} from "@/lib/worksites/geo";
import { listActiveWorksitesGeo } from "@/lib/worksites/queries";
import type { PortalEmployee } from "@/lib/portal/queries";

export type PortalClockStatus = {
  allowRemotePunch: boolean;
  requireGeofence: boolean;
  hasWorksites: boolean;
  hasFace: boolean;
  needsReenrollment: boolean;
  isClockedIn: boolean;
  onBreak: boolean;
  latestType: string | null;
  clockedInAt: string | null;
  allowedActions: AttendanceType[];
};

export const getPortalClockStatus = cache(async function getPortalClockStatus(
  employee: PortalEmployee
): Promise<PortalClockStatus> {
  const sites = await listActiveWorksitesGeo(employee.company_id);
  const latestType = await getLatestAttendanceType(
    employee.company_id,
    employee.id
  );
  const isClockedIn = isClockedInForStatus(latestType);
  const onBreak = isOnBreakForStatus(latestType);

  let clockedInAt: string | null = null;
  if (isClockedIn) {
    const admin = createClient();
    const { data: inEvent } = await admin
      .from("attendance")
      .select("timestamp")
      .eq("company_id", employee.company_id)
      .eq("employee_id", employee.id)
      .is("voided_at", null)
      .in("type", ["clock_in", "break_end"])
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    clockedInAt = inEvent?.timestamp ?? null;
  }

  const allowedActions: AttendanceType[] = [];
  if (!isClockedIn && !onBreak) allowedActions.push("clock_in");
  if (isClockedIn && !onBreak) {
    allowedActions.push("clock_out", "break_start");
  }
  if (onBreak) allowedActions.push("break_end");

  return {
    allowRemotePunch: employee.company_allow_remote_punch,
    requireGeofence: employee.company_require_geofence,
    hasWorksites: sites.length > 0,
    hasFace: employee.has_face_descriptor && !employee.needs_reenrollment,
    needsReenrollment: employee.needs_reenrollment,
    isClockedIn,
    onBreak,
    latestType,
    clockedInAt,
    allowedActions,
  };
});

export type PortalClockPunchResult =
  | {
      ok: true;
      type: AttendanceType;
      timestamp: string;
      faceScore: number;
      worksiteName: string | null;
      distanceM: number | null;
      withinGeofence: boolean | null;
    }
  | { error: string };

export async function submitPortalClockPunch(input: {
  employee: PortalEmployee;
  type: string;
  file: File;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  idempotencyKey: string | null;
}): Promise<PortalClockPunchResult> {
  const { employee } = input;

  if (!employee.company_allow_remote_punch) {
    return {
      error: "Remote clock-in is not enabled for your company.",
    };
  }

  if (!isAttendanceType(input.type)) {
    return { error: "Invalid clock action." };
  }

  if (!input.idempotencyKey) {
    return { error: "Missing punch key. Refresh the page and try again." };
  }

  const hasLocation =
    input.lat != null &&
    input.lng != null &&
    isValidLatLng(input.lat, input.lng);

  // Geofence-required companies need a real GPS fix. Optional geofence: best-effort
  // (desktop Wi‑Fi often times out — still allow face punch without coords).
  if (!hasLocation && employee.company_require_geofence) {
    return {
      error:
        "Location is required for your company. Allow location and try again, or use a phone with GPS.",
    };
  }

  // Cheap pre-check before face verify; record_punch still enforces transitions.
  const status = await getPortalClockStatus(employee);
  if (!status.allowedActions.includes(input.type)) {
    return {
      error: "That attendance action is not allowed right now. Refresh and try again.",
    };
  }

  if (employee.needs_reenrollment || !employee.has_face_descriptor) {
    return {
      error:
        "Face enrollment is required. Enroll on this page, or ask your manager to enroll you at the kiosk.",
    };
  }

  const sites = await listActiveWorksitesGeo(employee.company_id);
  const geofence = hasLocation
    ? matchGeofence(input.lat!, input.lng!, sites, input.accuracyM ?? 0)
    : null;

  if (employee.company_require_geofence) {
    if (sites.length === 0) {
      return {
        error:
          "No worksites are configured. Ask your manager to add a company location.",
      };
    }
    if (!geofence?.within) {
      const dist = geofence
        ? ` Nearest site is about ${Math.round(geofence.distance_m)}m away.`
        : "";
      return {
        error: `You are outside the allowed worksite area.${dist}`,
      };
    }
  }

  try {
    getPythonFaceServiceUrl();
  } catch {
    return { error: "Face recognition is not configured. Try again later." };
  }

  const admin = createClient();
  const { data: faceRow, error: faceLookupError } = await admin
    .from("employees")
    .select("face_descriptor, face_registered_at, needs_reenrollment, is_active")
    .eq("id", employee.id)
    .eq("company_id", employee.company_id)
    .maybeSingle();

  if (faceLookupError || !faceRow || !faceRow.is_active) {
    return { error: "Employee not found." };
  }
  if (faceRow.needs_reenrollment || !faceRow.face_descriptor) {
    return {
      error:
        "Face enrollment is required. Enroll on this page, or ask your manager to enroll you at the kiosk.",
    };
  }

  const preSwitch = isPreBuffaloScEnrollment(faceRow.face_registered_at);
  const storedEmbedding = parseStoredDescriptor(faceRow.face_descriptor);
  if (!storedEmbedding) {
    return { error: "Stored face data is invalid. Ask for re-enrollment." };
  }

  let verifyResult;
  try {
    verifyResult = await verifyFaceWithService(input.file, storedEmbedding, {
      employeeId: employee.id,
    });
  } catch (err) {
    const isUnavailable = err instanceof FaceServiceUnavailableError;
    await recordFaceVerifyAttempt({
      company_id: employee.company_id,
      employee_id: employee.id,
      tablet_id: null,
      verified: false,
      similarity_score: null,
      threshold_used: null,
      failure_reason: "API_ERROR",
      service_reason: isUnavailable
        ? "service_unavailable"
        : err instanceof Error
          ? err.message
          : "verify_failed",
      source: "api",
      pre_switch_enrollment: preSwitch,
    });
    return {
      error: isUnavailable
        ? err.message
        : "Could not verify your face. Try again.",
    };
  }

  const confidence = Number(verifyResult.confidence);
  const threshold = Number(verifyResult.threshold);
  const verified = Boolean(verifyResult.verified);
  const serviceReason = verifyResult.reason ?? null;

  await recordFaceVerifyAttempt({
    company_id: employee.company_id,
    employee_id: employee.id,
    tablet_id: null,
    verified,
    similarity_score: Number.isFinite(confidence) ? confidence : null,
    threshold_used: Number.isFinite(threshold) ? threshold : null,
    failure_reason: verified
      ? null
      : classifyServiceFailureReason(serviceReason),
    service_reason: serviceReason,
    source: "api",
    pre_switch_enrollment: preSwitch,
  });

  if (!verified) {
    return { error: "Face did not match. Try again in better light." };
  }

  let attendanceStatus: string | null = null;
  if (input.type === "clock_in") {
    const { data: empSchedule } = await admin
      .from("employees")
      .select("schedule_start_time")
      .eq("id", employee.id)
      .maybeSingle();
    const scheduleHm = String(empSchedule?.schedule_start_time ?? "09:00")
      .trim()
      .slice(0, 5);
    attendanceStatus = computeAttendanceStatus(
      new Date().toISOString(),
      scheduleHm,
      companyTimezone(employee.company_timezone)
    );
  }

  const punch = await invokeRecordPunch(admin, {
    companyId: employee.company_id,
    employeeId: employee.id,
    tabletId: null,
    type: input.type,
    idempotencyKey: input.idempotencyKey,
    clientTimestamp: null,
    faceMatchScore: Number.isFinite(confidence) ? confidence : null,
    attendanceStatus,
  });

  if ("kind" in punch) {
    return { error: punch.message };
  }

  const withinGeofence = geofence ? geofence.within : null;

  // Skip geo stamp on idempotent replay — attendance row already exists.
  if (!punch.replayed) {
    await admin
      .from("attendance")
      .update({
        punch_lat: hasLocation ? input.lat : null,
        punch_lng: hasLocation ? input.lng : null,
        punch_accuracy_m: hasLocation ? input.accuracyM : null,
        worksite_id: geofence?.worksite.id ?? null,
        within_geofence: withinGeofence,
        punch_source: "portal",
      })
      .eq("id", punch.attendance.id)
      .eq("company_id", employee.company_id);
  }

  return {
    ok: true,
    type: punch.attendance.type,
    timestamp: punch.attendance.timestamp,
    faceScore: Number(confidence.toFixed(4)),
    worksiteName: geofence?.worksite.name ?? null,
    distanceM: geofence ? Math.round(geofence.distance_m) : null,
    withinGeofence,
  };
}
