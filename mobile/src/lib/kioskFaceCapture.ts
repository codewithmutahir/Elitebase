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
  const formData = new FormData();
  formData.append("file", {
    uri: croppedUri,
    type: "image/jpeg",
    name: "face.jpg",
  } as unknown as Blob);
  formData.append("employee_id", employeeId);
  if (options?.includeConsent) {
    formData.append("consent", "true");
  }
  return formData;
}
