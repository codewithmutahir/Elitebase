import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { CameraView } from "expo-camera";
import {
  detectAndCropFace,
  type FaceDetectionFailureReason,
  type FaceDetectionResult,
} from "@/lib/faceDetection";

type SoftAutoCaptureOptions = {
  enabled: boolean;
  cameraRef: RefObject<CameraView | null>;
  requireFrontal?: boolean;
  /** How many consecutive good frames before we commit. */
  stableNeeded?: number;
  /** Delay between probe frames (ms). */
  intervalMs?: number;
  onAccepted: (result: Extract<FaceDetectionResult, { success: true }>) => void;
  onCoaching?: (reason: FaceDetectionFailureReason) => void;
};

/**
 * Soft auto-capture via still-frame probes (expo-camera has no live face stream).
 *
 * Important: after a successful accept, probing STOPS until `enabled` flips
 * false→true again. Continuously calling takePictureAsync makes the preview
 * blink and races with manual capture / uploads.
 */
export function useSoftFaceAutoCapture({
  enabled,
  cameraRef,
  requireFrontal = true,
  stableNeeded = 2,
  intervalMs = 2200,
  onAccepted,
  onCoaching,
}: SoftAutoCaptureOptions) {
  const streakRef = useRef(0);
  const busyRef = useRef(false);
  const onAcceptedRef = useRef(onAccepted);
  const onCoachingRef = useRef(onCoaching);

  useEffect(() => {
    onAcceptedRef.current = onAccepted;
  }, [onAccepted]);

  useEffect(() => {
    onCoachingRef.current = onCoaching;
  }, [onCoaching]);

  useEffect(() => {
    if (!enabled) {
      streakRef.current = 0;
      busyRef.current = false;
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let accepted = false;

    const schedule = (delay = intervalMs) => {
      if (cancelled || accepted) return;
      timer = setTimeout(() => {
        void probe();
      }, delay);
    };

    const probe = async () => {
      if (cancelled || accepted || busyRef.current) {
        schedule();
        return;
      }
      if (!cameraRef.current) {
        schedule();
        return;
      }

      busyRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          exif: false,
          skipProcessing: false,
          shutterSound: false,
        });

        if (cancelled || accepted || !photo?.uri) {
          streakRef.current = 0;
          return;
        }

        const detection = await detectAndCropFace(
          photo.uri,
          photo.width ?? 1,
          photo.height ?? 1,
          { requireFrontal }
        );

        if (cancelled || accepted) return;

        if (!detection.success) {
          streakRef.current = 0;
          onCoachingRef.current?.(detection.reason);
          return;
        }

        streakRef.current += 1;
        if (streakRef.current >= stableNeeded) {
          streakRef.current = 0;
          accepted = true;
          onAcceptedRef.current(detection);
          return;
        }
      } catch {
        streakRef.current = 0;
      } finally {
        busyRef.current = false;
        // Do not keep probing after a committed capture — parent re-enables.
        if (!cancelled && !accepted) schedule();
      }
    };

    // First probe after a short settle so the camera preview can attach.
    schedule(1200);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [cameraRef, enabled, intervalMs, requireFrontal, stableNeeded]);
}
