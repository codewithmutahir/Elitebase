import { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import {
  FACE_VERIFY_FAILURE_REASONS,
  type FaceVerifyFailureReason,
} from "@/lib/kiosk/face-verify-instrumentation";
import { recordFaceVerifyAttempt } from "@/lib/kiosk/record-face-verify-attempt";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

type ClientFaceLogBody = {
  employee_id?: string;
  failure_reason?: string;
  /** Optional client notes, e.g. ML Kit reason */
  detail?: string;
};

const CLIENT_REASONS = new Set<FaceVerifyFailureReason>([
  "NO_FACE_DETECTED",
  "LOCAL_LOW_CONFIDENCE",
  "TIMEOUT",
  "API_ERROR",
]);

/**
 * Client-side instrumentation for failures that never reach /verify-face
 * (ML Kit gate, axios timeout). No effect on match logic.
 */
export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const body = await parseJsonBody<ClientFaceLogBody>(request);
  if (body instanceof Response) return body;

  const employeeId = String(body.employee_id ?? "").trim();
  const failureReason = String(body.failure_reason ?? "").trim();

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (
    !FACE_VERIFY_FAILURE_REASONS.includes(
      failureReason as FaceVerifyFailureReason
    ) ||
    !CLIENT_REASONS.has(failureReason as FaceVerifyFailureReason)
  ) {
    return jsonError("Invalid failure_reason for client log.", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  await recordFaceVerifyAttempt({
    company_id: tablet.company_id,
    employee_id: employeeId,
    tablet_id: tablet.id,
    verified: false,
    similarity_score: null,
    threshold_used: null,
    failure_reason: failureReason as FaceVerifyFailureReason,
    service_reason: body.detail ? String(body.detail).slice(0, 200) : null,
    source: "client",
  });

  return jsonOk({ logged: true });
}
