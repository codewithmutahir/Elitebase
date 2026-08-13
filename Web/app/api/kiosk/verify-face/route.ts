import { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  rejectOversizedBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { parseStoredDescriptor } from "@/lib/kiosk/face";
import {
  classifyServiceFailureReason,
  isPreBuffaloScEnrollment,
} from "@/lib/kiosk/face-verify-instrumentation";
import { recordFaceVerifyAttempt } from "@/lib/kiosk/record-face-verify-attempt";
import {
  FaceServiceUnavailableError,
  getPythonFaceServiceUrl,
  verifyFaceWithService,
} from "@/lib/kiosk/python-face-service";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";
export const maxDuration = 60;

function collectUploadFile(formData: FormData): File | null {
  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return single;

  // Kiosk historically posts `files` (same as register-face multi-sample).
  const fromFiles = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  return fromFiles[0] ?? null;
}

export async function POST(request: NextRequest) {
  const tooLarge = rejectOversizedBody(request);
  if (tooLarge) return tooLarge;

  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  try {
    getPythonFaceServiceUrl();
  } catch {
    return jsonError("Face recognition service is not configured.", 503);
  }

  const formData = await request.formData();
  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const file = collectUploadFile(formData);

  console.info(
    "[kiosk/verify-face] start",
    JSON.stringify({
      employee_id: employeeId || null,
      has_file: Boolean(file),
      bytes: file?.size ?? 0,
      tablet_id: tablet.id,
    })
  );

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (!file) {
    return jsonError("file is required (multipart image upload).", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  if (!employee.face_descriptor) {
    return jsonError("Face not registered for this employee.", 400);
  }

  if (employee.needs_reenrollment) {
    return jsonError(
      "Face re-enrollment required. Please re-scan your face at the kiosk.",
      409
    );
  }

  const preSwitch = isPreBuffaloScEnrollment(employee.face_registered_at);
  const storedEmbedding = parseStoredDescriptor(employee.face_descriptor);
  if (!storedEmbedding) {
    await recordFaceVerifyAttempt({
      company_id: tablet.company_id,
      employee_id: employeeId,
      tablet_id: tablet.id,
      verified: false,
      similarity_score: null,
      threshold_used: null,
      failure_reason: "API_ERROR",
      service_reason: "invalid_stored_embedding",
      source: "api",
      pre_switch_enrollment: preSwitch,
    });
    return jsonError("Stored face embedding is invalid.", 500);
  }

  let result;
  try {
    result = await verifyFaceWithService(file, storedEmbedding, {
      employeeId,
    });
  } catch (err) {
    const isUnavailable = err instanceof FaceServiceUnavailableError;
    const message =
      err instanceof Error ? err.message : "Could not verify face.";

    await recordFaceVerifyAttempt({
      company_id: tablet.company_id,
      employee_id: employeeId,
      tablet_id: tablet.id,
      verified: false,
      similarity_score: null,
      threshold_used: null,
      failure_reason: "API_ERROR",
      service_reason: isUnavailable ? "service_unavailable" : message,
      source: "api",
      pre_switch_enrollment: preSwitch,
    });

    if (isUnavailable) {
      return jsonError(err.message, 503);
    }
    return jsonError(message, 400);
  }

  const confidence = Number(result.confidence);
  const threshold = Number(result.threshold);
  const verified = Boolean(result.verified);
  const confidenceLevel = result.confidence_level ?? "low";
  const serviceReason = result.reason ?? null;
  const failureReason = verified
    ? null
    : classifyServiceFailureReason(serviceReason);

  await recordFaceVerifyAttempt({
    company_id: tablet.company_id,
    employee_id: employeeId,
    tablet_id: tablet.id,
    verified,
    similarity_score: Number.isFinite(confidence) ? confidence : null,
    threshold_used: Number.isFinite(threshold) ? threshold : null,
    failure_reason: failureReason,
    service_reason: serviceReason,
    source: "api",
    pre_switch_enrollment: preSwitch,
  });

  return jsonOk({
    employee_id: employeeId,
    verified,
    confidence: Number(confidence.toFixed(4)),
    match_score: Number(confidence.toFixed(4)),
    confidence_level: confidenceLevel,
    threshold,
    reason: serviceReason,
  });
}
