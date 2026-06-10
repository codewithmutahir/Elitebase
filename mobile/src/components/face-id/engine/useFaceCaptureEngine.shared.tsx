import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { FacePhase } from "@/components/face-id/types";
import type { FaceCaptureEngine, FaceEngineCallbacks } from "./types";

type CaptureHandler = (uri: string) => Promise<number[]>;

type Options = {
  callbacks: FaceEngineCallbacks;
  enabled: boolean;
  resetKey: number;
  captureHandler: CaptureHandler | null;
};

export function useExpoCameraFaceEngine({
  callbacks,
  enabled,
  resetKey,
  captureHandler,
}: Options): FaceCaptureEngine {
  const [permission, requestPermission] = useCameraPermissions();
  const [facePhase, setFacePhase] = useState<FacePhase>("idle");
  const [steadyProgress, setSteadyProgress] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const capturingRef = useRef(false);

  useEffect(() => {
    setFacePhase("idle");
    setSteadyProgress(0);
    capturingRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const emitPhase = useCallback(
    (phase: FacePhase, progress: number) => {
      setFacePhase(phase);
      setSteadyProgress(progress);
      callbacks.onFacePhase(phase, progress);
    },
    [callbacks]
  );

  const requestCapture = useCallback(async () => {
    if (capturingRef.current || !cameraRef.current) {
      callbacks.onCaptureFailed();
      return;
    }
    if (!captureHandler) {
      console.log(
        "[FaceCapture] MobileFaceNet requires a dev build (not Expo Go)."
      );
      callbacks.onCaptureFailed();
      return;
    }

    capturingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        quality: 0.85,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        callbacks.onCaptureFailed();
        return;
      }
      const embedding = await captureHandler(photo.uri);
      callbacks.onEmbedding(embedding);
    } catch (err) {
      console.log("[FaceCapture] capture failed", err);
      callbacks.onCaptureFailed();
    } finally {
      capturingRef.current = false;
    }
  }, [callbacks, captureHandler]);

  const boostStability = useCallback(() => {
    emitPhase("centered", 1);
  }, [emitPhase]);

  const reset = useCallback(() => {
    capturingRef.current = false;
    emitPhase("idle", 0);
  }, [emitPhase]);

  const CameraLayer = useCallback(() => {
    if (!permission?.granted) {
      return <View style={styles.fallback} />;
    }
    return (
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        active={enabled}
      />
    );
  }, [enabled, permission?.granted]);

  const isReady = Boolean(permission?.granted);

  return {
    CameraLayer,
    isReady,
    facePhase,
    steadyProgress,
    requestCapture,
    boostStability,
    reset,
  };
}

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
});
