import type { ComponentType } from "react";
import type { FacePhase } from "@/components/face-id/types";

export type FaceEngineCallbacks = {
  onEmbedding: (embedding: number[]) => void;
  onFacePhase: (phase: FacePhase, steadyProgress: number) => void;
  onCaptureFailed: () => void;
};

export type FaceCaptureEngine = {
  CameraLayer: ComponentType;
  isReady: boolean;
  facePhase: FacePhase;
  steadyProgress: number;
  /** Begin arc fill then capture on next valid frame. */
  requestCapture: () => void | Promise<void>;
  /** Skip stability wait (manual tap while detecting). */
  boostStability: () => void;
  reset: () => void;
};
