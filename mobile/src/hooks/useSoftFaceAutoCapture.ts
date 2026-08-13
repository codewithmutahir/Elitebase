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
 * Soft auto-capture: periodically probe with takePictureAsync + ML Kit quality
 * gates. When `stableNeeded` consecutive probes pass, fire onAccepted.
 * Does not call InsightFace — screens own the upload step.
 */
export function useSoftFaceAutoCapture({
  enabled,
  cameraRef,
  requireFrontal = true,
  stableNeeded = 2,
  intervalMs = 950,
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
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const probe = async () => {
      if (cancelled || busyRef.current) {
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

        if (cancelled || !photo?.uri) {
          streakRef.current = 0;
          return;
        }

        const detection = await detectAndCropFace(
          photo.uri,
          photo.width ?? 1,
          photo.height ?? 1,
          { requireFrontal }
        );

        if (cancelled) return;

        if (!detection.success) {
          streakRef.current = 0;
          onCoachingRef.current?.(detection.reason);
          return;
        }

        streakRef.current += 1;
        if (streakRef.current >= stableNeeded) {
          streakRef.current = 0;
          onAcceptedRef.current(detection);
          return;
        }
      } catch {
        streakRef.current = 0;
      } finally {
        busyRef.current = false;
        if (!cancelled) schedule();
      }
    };

    const schedule = () => {
      timer = setTimeout(() => {
        void probe();
      }, intervalMs);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    cameraRef,
    enabled,
    intervalMs,
    requireFrontal,
    stableNeeded,
  ]);
}
