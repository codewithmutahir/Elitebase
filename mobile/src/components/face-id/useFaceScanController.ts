import { useCallback, useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ARC_FILL_MS,
  FAILED_RESET_MS,
  SUCCESS_HOLD_MS,
} from "@/components/face-id/constants";
import type { ApiPhase, FacePhase, ScanState } from "@/components/face-id/types";
import type { FaceCaptureEngine } from "@/components/face-id/engine/types";

type Options = {
  engine: FaceCaptureEngine;
  apiPhase: ApiPhase;
  enabled: boolean;
  resetKey: number;
  onArcCompleteCapture: () => void;
};

export function useFaceScanController({
  engine,
  apiPhase,
  enabled,
  resetKey,
  onArcCompleteCapture,
}: Options) {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [fillProgress, setFillProgress] = useState(0);
  const [fillPercent, setFillPercent] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const scanningLockRef = useRef(false);
  const stableTriggeredRef = useRef(false);
  const arcTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearArcTimer = useCallback(() => {
    if (arcTimerRef.current) {
      clearInterval(arcTimerRef.current);
      arcTimerRef.current = null;
    }
  }, []);

  const resetToIdle = useCallback(() => {
    clearArcTimer();
    scanningLockRef.current = false;
    stableTriggeredRef.current = false;
    setFillProgress(0);
    setFillPercent(0);
    setAutoCountdown(null);
    setScanState("idle");
    engine.reset();
  }, [clearArcTimer, engine]);

  const startScanningArc = useCallback(() => {
    if (scanningLockRef.current) return;
    scanningLockRef.current = true;
    setScanState("scanning");
    setFillProgress(0);
    setFillPercent(0);
    setAutoCountdown(Math.ceil(ARC_FILL_MS / 1000));

    const started = Date.now();
    arcTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const p = Math.min(elapsed / ARC_FILL_MS, 1);
      setFillProgress(p);
      setFillPercent(Math.round(p * 100));
      setAutoCountdown(Math.max(1, Math.ceil((ARC_FILL_MS - elapsed) / 1000)));

      if (p >= 1) {
        clearArcTimer();
        setAutoCountdown(null);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScanState("processing");
        onArcCompleteCapture();
      }
    }, 16);
  }, [clearArcTimer, onArcCompleteCapture]);

  const handleFacePhase = useCallback(
    (phase: FacePhase, progress: number) => {
      if (!enabled || apiPhase !== "none") return;
      if (scanState === "scanning" || scanState === "processing") return;

      if (phase === "idle") {
        stableTriggeredRef.current = false;
        if (scanState === "detecting") {
          setScanState("idle");
        }
        return;
      }

      if (phase === "detecting") {
        stableTriggeredRef.current = false;
        setScanState("detecting");
        return;
      }

      if (phase === "centered") {
        if (progress >= 1 && !stableTriggeredRef.current) {
          stableTriggeredRef.current = true;
          startScanningArc();
        } else {
          setScanState("detecting");
        }
      }
    },
    [apiPhase, enabled, scanState, startScanningArc]
  );

  const handleManualCapture = useCallback(() => {
    if (!enabled || apiPhase !== "none") return;
    if (scanState === "scanning" || scanState === "processing") return;

    if (scanState === "idle") {
      engine.boostStability();
      setScanState("detecting");
    }
    startScanningArc();
  }, [apiPhase, enabled, engine, scanState, startScanningArc]);

  useEffect(() => {
    resetToIdle();
  }, [resetKey, resetToIdle]);

  useEffect(() => {
    if (apiPhase === "processing") {
      clearArcTimer();
      setScanState("processing");
      return;
    }
    if (apiPhase === "success") {
      clearArcTimer();
      setScanState("success");
      const t = setTimeout(() => {
        /* navigation handled by parent */
      }, SUCCESS_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (apiPhase === "failed") {
      clearArcTimer();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState("failed");
      setRetryCountdown(2);
      const interval = setInterval(() => {
        setRetryCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            resetToIdle();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [apiPhase, clearArcTimer, resetToIdle]);

  useEffect(() => () => clearArcTimer(), [clearArcTimer]);

  return {
    scanState,
    fillProgress,
    fillPercent,
    retryCountdown,
    autoCountdown,
    handleFacePhase,
    handleManualCapture,
    resetToIdle,
    startScanningArc,
  };
}
