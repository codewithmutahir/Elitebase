import { StyleSheet, useWindowDimensions, View } from "react-native";
import { FaceCaptureButton } from "@/components/face-id/FaceCaptureButton";
import { FaceInfoPanel } from "@/components/face-id/FaceInfoPanel";
import { FaceLandmarkDots } from "@/components/face-id/FaceLandmarkDots";
import { FaceScannerCenterContent } from "@/components/face-id/FaceScannerCenterContent";
import { FaceScannerRing } from "@/components/face-id/FaceScannerRing";
import { FaceScannerTopBar } from "@/components/face-id/FaceScannerTopBar";
import type { useFaceScanController } from "@/components/face-id/useFaceScanController";
import type { ApiPhase } from "@/components/face-id/types";
import type { FaceCaptureEngine } from "@/components/face-id/engine/types";

export type FaceIdScanExperienceCoreProps = {
  title: string;
  employeeName: string;
  companyName: string;
  initials: string;
  avatarColor: string;
  successTitle: string;
  successSubtitle: string;
  apiPhase: ApiPhase;
  enabled?: boolean;
  onBack: () => void;
  engine: FaceCaptureEngine;
  controller: ReturnType<typeof useFaceScanController>;
};

export function FaceIdScanExperienceCore({
  title,
  employeeName,
  companyName,
  initials,
  avatarColor,
  successTitle,
  successSubtitle,
  apiPhase,
  enabled,
  onBack,
  engine,
  controller,
}: FaceIdScanExperienceCoreProps) {
  const { width, height } = useWindowDimensions();
  const scannerCenterX = width * 0.4;
  const scannerCenterY = height * 0.5;

  const { CameraLayer } = engine;
  const showDots =
    controller.scanState === "detecting" ||
    controller.scanState === "scanning";

  const captureDisabled =
    !enabled ||
    !engine.isReady ||
    controller.scanState === "processing" ||
    controller.scanState === "success" ||
    apiPhase !== "none";

  return (
    <View style={styles.root}>
      <CameraLayer />
      <View style={styles.dimOverlay} pointerEvents="none" />

      <FaceScannerRing
        scanState={controller.scanState}
        fillProgress={controller.fillProgress}
        scannerCenterX={scannerCenterX}
        scannerCenterY={scannerCenterY}
      />

      <FaceLandmarkDots
        visible={showDots}
        centerX={scannerCenterX}
        centerY={scannerCenterY}
      />

      <FaceScannerCenterContent
        scanState={controller.scanState}
        fillPercent={controller.fillPercent}
        centerX={scannerCenterX}
        centerY={scannerCenterY}
      />

      <FaceScannerTopBar title={title} onBack={onBack} />

      <FaceInfoPanel
        employeeName={employeeName}
        companyName={companyName}
        initials={initials}
        avatarColor={avatarColor}
        scanState={controller.scanState}
        fillProgress={controller.fillProgress}
        retryCountdown={controller.retryCountdown}
        successTitle={successTitle}
        successSubtitle={successSubtitle}
      />

      <FaceCaptureButton
        scanState={controller.scanState}
        countdownSeconds={controller.autoCountdown}
        disabled={captureDisabled}
        onPress={controller.handleManualCapture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
});
