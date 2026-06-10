import type { FaceCaptureEngine, FaceEngineCallbacks } from "./types";
import { useExpoCameraFaceEngine } from "./useFaceCaptureEngine.shared";

/** Expo Go: preview + manual capture UI; embeddings need a dev build. */
export function useFaceCaptureEngine(
  callbacks: FaceEngineCallbacks,
  enabled: boolean,
  resetKey: number
): FaceCaptureEngine {
  return useExpoCameraFaceEngine({
    callbacks,
    enabled,
    resetKey,
    captureHandler: null,
  });
}
