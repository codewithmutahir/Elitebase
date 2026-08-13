import type { FaceDetectionFailureReason } from "@/lib/faceDetection";

export function faceDetectionReasonToScanState(
  reason: FaceDetectionFailureReason
): "failed_no_face" | "failed_multiple" | "failed_too_small" {
  if (reason === "multiple_faces") return "failed_multiple";
  if (reason === "too_small") return "failed_too_small";
  return "failed_no_face";
}

/** Map InsightFace /verify-face `reason` to scan state + user copy. */
export function verifyServiceReasonToUi(reason: string | null | undefined): {
  scanState:
    | "failed_no_face"
    | "failed_too_small"
    | "failed_multiple"
    | "failed_no_match";
  message: string;
  /** Identity mismatch only — framing/lighting should not burn attempts. */
  burnsMatchAttempt: boolean;
} {
  switch (reason) {
    case "no_face":
      return {
        scanState: "failed_no_face",
        message: "No face found — center your face in the oval.",
        burnsMatchAttempt: false,
      };
    case "face_not_clear":
      return {
        scanState: "failed_too_small",
        message: "Face not clear — move closer and face the light.",
        burnsMatchAttempt: false,
      };
    case "multiple_faces":
      return {
        scanState: "failed_multiple",
        message: "Only one face in frame, please.",
        burnsMatchAttempt: false,
      };
    case "below_threshold":
    case "invalid_embedding":
      return {
        scanState: "failed_no_match",
        message: "Face not recognized. Try again.",
        burnsMatchAttempt: true,
      };
    default:
      return {
        scanState: "failed_no_match",
        message: "Face not recognized. Try again.",
        burnsMatchAttempt: true,
      };
  }
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
  if (uris[0]) {
    formData.append("file", asRnFile(uris[0], 0) as unknown as Blob);
  }
  formData.append("employee_id", employeeId);
  if (options?.includeConsent) {
    formData.append("consent", "true");
  }
  return formData;
}
