import { useRef } from "react";
import { useFaceCaptureEngine } from "@/components/face-id/engine/useFaceCaptureEngine";
import { FaceIdScanExperienceCore } from "@/components/face-id/FaceIdScanExperienceCore";
import { useFaceScanController } from "@/components/face-id/useFaceScanController";
import type { FacePhase } from "@/components/face-id/types";
import type { FaceIdScanExperienceProps } from "@/components/face-id/FaceIdScanExperience.types";

export type { FaceIdScanExperienceProps } from "@/components/face-id/FaceIdScanExperience.types";

export function FaceIdScanExperience(props: FaceIdScanExperienceProps) {
  const enabled = props.enabled !== false;
  const resetKey = props.resetKey ?? 0;

  const facePhaseHandlerRef = useRef<(phase: FacePhase, progress: number) => void>(
    () => {}
  );

  const engine = useFaceCaptureEngine(
    {
      onEmbedding: props.onEmbedding,
      onFacePhase: (phase, progress) =>
        facePhaseHandlerRef.current(phase, progress),
      onCaptureFailed: props.onCaptureFailed,
    },
    enabled && props.apiPhase === "none",
    resetKey
  );

  const controller = useFaceScanController({
    engine,
    apiPhase: props.apiPhase,
    enabled,
    resetKey,
    onArcCompleteCapture: () => {
      void engine.requestCapture();
    },
  });

  facePhaseHandlerRef.current = controller.handleFacePhase;

  return (
    <FaceIdScanExperienceCore
      {...props}
      engine={engine}
      controller={controller}
    />
  );
}
