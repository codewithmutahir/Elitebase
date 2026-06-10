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
  FaceServiceUnavailableError,
  getPythonFaceServiceUrl,
  verifyFaceWithService,
} from "@/lib/kiosk/python-face-service";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

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
  const file = formData.get("file");

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("file is required (multipart image upload).", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  if (!employee.face_descriptor) {
    return jsonError("Face not registered for this employee.", 400);
  }

  const storedEmbedding = parseStoredDescriptor(employee.face_descriptor);
  if (!storedEmbedding) {
    return jsonError("Stored face embedding is invalid.", 500);
  }

  let result;
  try {
    result = await verifyFaceWithService(file, storedEmbedding);
  } catch (err) {
    if (err instanceof FaceServiceUnavailableError) {
      return jsonError(err.message, 503);
    }
    const message =
      err instanceof Error ? err.message : "Could not verify face.";
    return jsonError(message, 400);
  }

  const confidence = Number(result.confidence);
  const threshold = Number(result.threshold);
  const verified = Boolean(result.verified);
  const confidenceLevel = result.confidence_level ?? "low";

  if (process.env.NODE_ENV !== "production") {
    console.info("[kiosk/verify-face] match result", {
      employeeId,
      similarity: confidence,
      threshold,
      confidenceLevel,
      verified,
      reason: result.reason ?? null,
    });
  }

  return jsonOk({
    employee_id: employeeId,
    verified,
    confidence: Number(confidence.toFixed(4)),
    match_score: Number(confidence.toFixed(4)),
    confidence_level: confidenceLevel,
    threshold,
    reason: result.reason ?? null,
  });
}
