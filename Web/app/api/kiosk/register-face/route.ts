import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  rejectOversizedBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import {
  FACE_DESCRIPTOR_LENGTH,
  FaceServiceUnavailableError,
  extractEmbeddingFromImage,
  getPythonFaceServiceUrl,
} from "@/lib/kiosk/python-face-service";
import { formatDescriptorForStorage } from "@/lib/kiosk/face";
import { getEmployeeForTablet } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

function collectUploadFiles(formData: FormData): File[] {
  const fromFiles = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);
  if (fromFiles.length > 0) return fromFiles;

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];

  return [];
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
  const consent = formData.get("consent");
  const uploadFiles = collectUploadFiles(formData);

  if (!employeeId) {
    return jsonError("employee_id is required.", 400);
  }

  if (String(consent ?? "") !== "true") {
    return jsonError("Biometric consent is required.", 400);
  }

  if (uploadFiles.length === 0) {
    return jsonError("file is required (multipart image upload).", 400);
  }

  const employee = await getEmployeeForTablet(tablet.company_id, employeeId);
  if (!employee || !employee.is_active) {
    return jsonError("Employee not found.", 404);
  }

  let extraction;
  try {
    extraction = await extractEmbeddingFromImage(
      uploadFiles.length === 1 ? uploadFiles[0]! : uploadFiles
    );
  } catch (err) {
    if (err instanceof FaceServiceUnavailableError) {
      return jsonError(err.message, 503);
    }
    const message =
      err instanceof Error ? err.message : "Could not extract face embedding.";
    return jsonError(message, 400);
  }

  if (extraction.embedding.length !== FACE_DESCRIPTOR_LENGTH) {
    return jsonError("Invalid embedding length from face service.", 500);
  }

  const now = new Date().toISOString();
  const admin = createClient();
  const { error } = await admin
    .from("employees")
    .update({
      face_descriptor: formatDescriptorForStorage(extraction.embedding),
      face_consent: true,
      face_consent_at: now,
      face_registered_at: now,
    })
    .eq("id", employeeId)
    .eq("company_id", tablet.company_id);

  if (error) {
    console.error("register-face failed:", error.message);
    return jsonError("Could not save face registration.", 500);
  }

  return jsonOk({
    employee_id: employeeId,
    face_registered: true,
    face_consent: true,
    detection_confidence: extraction.confidence,
    samples_used: extraction.samples_used,
  });
}
