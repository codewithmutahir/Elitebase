import { createClient } from "@/lib/supabase/server";
import { formatDescriptorForStorage } from "@/lib/kiosk/face";
import {
  FACE_DESCRIPTOR_LENGTH,
  FaceServiceUnavailableError,
  extractEmbeddingFromImage,
  getPythonFaceServiceUrl,
} from "@/lib/kiosk/python-face-service";
import type { PortalEmployee } from "@/lib/portal/queries";

export type PortalEnrollFaceResult =
  | {
      ok: true;
      samplesUsed: number;
      detectionConfidence: number | null;
    }
  | { error: string };

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 5;

/**
 * Self-serve face enrollment for employees when the company allows remote punch.
 * Uses the same InsightFace extract path as kiosk register-face.
 */
export async function submitPortalFaceEnrollment(input: {
  employee: PortalEmployee;
  files: File[];
  consent: boolean;
}): Promise<PortalEnrollFaceResult> {
  const { employee } = input;

  if (!employee.company_allow_remote_punch) {
    return {
      error:
        "Remote clock-in is not enabled. Face enrollment on the web is only available when your employer allows portal punch.",
    };
  }

  if (!input.consent) {
    return { error: "Biometric consent is required to enroll your face." };
  }

  const files = input.files.filter((file) => file instanceof File && file.size > 0);
  if (files.length === 0) {
    return { error: "At least one camera photo is required." };
  }
  if (files.length > MAX_FILES) {
    return { error: "Too many photos. Try again with fewer samples." };
  }
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return { error: "One of the photos is too large. Try again." };
    }
  }

  try {
    getPythonFaceServiceUrl();
  } catch {
    return { error: "Face recognition is not configured. Try again later." };
  }

  let extraction;
  try {
    extraction = await extractEmbeddingFromImage(
      files.length === 1 ? files[0]! : files
    );
  } catch (err) {
    if (err instanceof FaceServiceUnavailableError) {
      return { error: err.message };
    }
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not detect a face. Try better lighting and look at the camera.",
    };
  }

  if (extraction.embedding.length !== FACE_DESCRIPTOR_LENGTH) {
    return { error: "Face service returned an invalid result. Try again." };
  }

  const now = new Date().toISOString();
  const admin = createClient();
  const { data: updated, error } = await admin
    .from("employees")
    .update({
      face_descriptor: formatDescriptorForStorage(extraction.embedding),
      face_consent: true,
      face_consent_at: now,
      face_registered_at: now,
      needs_reenrollment: false,
    })
    .eq("id", employee.id)
    .eq("company_id", employee.company_id)
    .eq("is_active", true)
    .select("id");

  if (error) {
    console.error("portal face enroll failed:", error.message);
    return { error: "Could not save face enrollment. Try again." };
  }
  if (!updated?.length) {
    return { error: "Employee not found or inactive." };
  }

  return {
    ok: true,
    samplesUsed: extraction.samples_used ?? files.length,
    detectionConfidence:
      typeof extraction.confidence === "number" ? extraction.confidence : null,
  };
}
