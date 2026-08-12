/**
 * Editable constant: when production face service switched buffalo_l → buffalo_sc.
 * Used to flag pre-switch enrollments for analysis (and Phase 2 re-enrollment).
 */
export const BUFFALO_SC_SWITCH_AT = "2026-07-18T00:00:00.000Z";

export const FACE_VERIFY_FAILURE_REASONS = [
  "NO_FACE_DETECTED",
  "LOCAL_LOW_CONFIDENCE",
  "API_NO_MATCH",
  "API_ERROR",
  "TIMEOUT",
] as const;

export type FaceVerifyFailureReason =
  (typeof FACE_VERIFY_FAILURE_REASONS)[number];

export type FaceVerifyAttemptOutcome =
  | { verified: true; failure_reason: null }
  | { verified: false; failure_reason: FaceVerifyFailureReason };

export type FaceVerifyAttemptLog = {
  company_id: string;
  employee_id: string;
  tablet_id?: string | null;
  verified: boolean;
  similarity_score: number | null;
  threshold_used: number | null;
  failure_reason: FaceVerifyFailureReason | null;
  service_reason?: string | null;
  source: "api" | "client";
  pre_switch_enrollment?: boolean | null;
};

/** Map InsightFace /verify-face `reason` fields to our failure enum. */
export function classifyServiceFailureReason(
  serviceReason: string | null | undefined
): FaceVerifyFailureReason {
  switch (serviceReason) {
    case "no_face":
    case "multiple_faces":
    case "face_not_clear":
      return "LOCAL_LOW_CONFIDENCE";
    case "invalid_embedding":
      return "API_ERROR";
    default:
      return "API_NO_MATCH";
  }
}

export function isPreBuffaloScEnrollment(
  faceRegisteredAt: string | null | undefined,
  switchAt: string = BUFFALO_SC_SWITCH_AT
): boolean {
  if (!faceRegisteredAt) return false;
  return new Date(faceRegisteredAt).getTime() < new Date(switchAt).getTime();
}

export function logFaceVerifyAttempt(payload: FaceVerifyAttemptLog) {
  console.info(
    "[face-verify-attempt]",
    JSON.stringify({
      employee_id: payload.employee_id,
      company_id: payload.company_id,
      tablet_id: payload.tablet_id ?? null,
      verified: payload.verified,
      similarity_score: payload.similarity_score,
      threshold_used: payload.threshold_used,
      failure_reason: payload.failure_reason,
      service_reason: payload.service_reason ?? null,
      source: payload.source,
      pre_switch_enrollment: payload.pre_switch_enrollment ?? null,
      buffalo_sc_switch_at: BUFFALO_SC_SWITCH_AT,
      at: new Date().toISOString(),
    })
  );
}
