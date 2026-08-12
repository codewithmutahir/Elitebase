import type { FaceDetectionFailureReason } from "@/lib/faceDetection";

export function faceDetectionReasonToScanState(
  reason: FaceDetectionFailureReason
): "failed_no_face" | "failed_multiple" | "failed_too_small" {
  if (reason === "multiple_faces") return "failed_multiple";
  if (reason === "too_small") return "failed_too_small";
  return "failed_no_face";
}

export function buildFaceUploadFormData(
  croppedUri: string,
  employeeId: string,
  options?: { includeConsent?: boolean }
) {
  return buildFaceUploadFormDataFromUris([croppedUri], employeeId, options);
}

/** Multi-sample enrollment: appends each URI as `files` for server-side averaging. */
export function buildFaceUploadFormDataFromUris(
  uris: string[],
  employeeId: string,
  options?: { includeConsent?: boolean }
) {
  const formData = new FormData();
  uris.forEach((uri, index) => {
    formData.append("files", {
      uri,
      type: "image/jpeg",
      name: `face_${index + 1}.jpg`,
    } as unknown as Blob);
  });
  formData.append("employee_id", employeeId);
  if (options?.includeConsent) {
    formData.append("consent", "true");
  }
  return formData;
}
