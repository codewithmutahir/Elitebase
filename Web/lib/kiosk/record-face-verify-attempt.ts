import { createClient } from "@/lib/supabase/server";
import {
  logFaceVerifyAttempt,
  type FaceVerifyAttemptLog,
  type FaceVerifyFailureReason,
} from "@/lib/kiosk/face-verify-instrumentation";

/** Persist + console-log a verify attempt. Never throws (instrumentation must not break verify). */
export async function recordFaceVerifyAttempt(
  payload: FaceVerifyAttemptLog
): Promise<void> {
  logFaceVerifyAttempt(payload);

  try {
    const admin = createClient();
    const { error } = await admin.from("face_verify_attempts").insert({
      company_id: payload.company_id,
      employee_id: payload.employee_id,
      tablet_id: payload.tablet_id ?? null,
      verified: payload.verified,
      similarity_score: payload.similarity_score,
      threshold_used: payload.threshold_used,
      failure_reason: payload.failure_reason,
      service_reason: payload.service_reason ?? null,
      source: payload.source,
    });

    if (error) {
      console.error(
        "[face-verify-attempt] persist failed:",
        error.message
      );
    }
  } catch (err) {
    console.error("[face-verify-attempt] persist error:", err);
  }
}

export type { FaceVerifyFailureReason };
