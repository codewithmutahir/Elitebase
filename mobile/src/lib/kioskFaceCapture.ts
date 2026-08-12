import type { FaceDetectionFailureReason } from "@/lib/faceDetection";

export function faceDetectionReasonToScanState(
  reason: FaceDetectionFailureReason
): "failed_no_face" | "failed_multiple" | "failed_too_small" {
  if (reason === "multiple_faces") return "failed_multiple";
  if (reason === "too_small") return "failed_too_small";
  return "failed_no_face";
}

type RnFilePart = {
  uri: string;
  type: string;
  name: string;
};

function asRnFile(uri: string, index: number): RnFilePart {
  return {
    uri,
    type: "image/jpeg",
    name: `face_${index + 1}.jpg`,
  };
}

export function buildFaceUploadFormData(
  croppedUri: string,
  employeeId: string,
  options?: { includeConsent?: boolean }
) {
  const formData = new FormData();
  const part = asRnFile(croppedUri, 0);
  // verify-face accepts `file`; register-face accepts `file` or `files`.
  formData.append("file", part as unknown as Blob);
  formData.append("files", part as unknown as Blob);
  formData.append("employee_id", employeeId);
  if (options?.includeConsent) {
    formData.append("consent", "true");
  }
  return formData;
}

/** Multi-sample enrollment: appends each URI as `files` for server-side averaging. */
export function buildFaceUploadFormDataFromUris(
  uris: string[],
  employeeId: string,
  options?: { includeConsent?: boolean }
) {
  const formData = new FormData();
  uris.forEach((uri, index) => {
    formData.append("files", asRnFile(uri, index) as unknown as Blob);
  });
  // Also set singular `file` for single-sample callers / older servers.
  if (uris[0]) {
    formData.append("file", asRnFile(uris[0], 0) as unknown as Blob);
  }
  formData.append("employee_id", employeeId);
  if (options?.includeConsent) {
    formData.append("consent", "true");
  }
  return formData;
}
