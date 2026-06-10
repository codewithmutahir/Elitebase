import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { FaceCaptureView } from "@/components/FaceCaptureView";
import { ScreenBackground } from "@/components/ScreenBackground";
import type { KioskScanState } from "@/components/kiosk/types";
import { T } from "@/constants/tokens";
import type { ApiPhase } from "@/components/face-id/types";
import { api } from "@/lib/api";
import { avatarColor, employeeInitials } from "@/lib/format";
import { getKioskApiErrorMessage } from "@/lib/kiosk";
import { detectAndCropFace } from "@/lib/faceDetection";
import {
  buildFaceUploadFormData,
  faceDetectionReasonToScanState,
} from "@/lib/kioskFaceCapture";
import { hapticError, hapticSuccess, onPressHaptic } from "@/lib/kioskUi";
import { isExpoGo } from "@/lib/runtime";
import { getTabletConfig, getTabletToken } from "@/lib/storage";
import type { RootStackParamList } from "@/types";

type FaceScanRoute = RouteProp<RootStackParamList, "FaceScan">;
type FaceScanNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "FaceScan"
>;

type VerifyFaceResponse = {
  employee_id: string;
  verified: boolean;
  confidence: number;
  match_score: number;
  threshold: number;
  reason?: string | null;
};

const MAX_ATTEMPTS = 3;

export function FaceScanScreen() {
  const route = useRoute<FaceScanRoute>();
  const navigation = useNavigation<FaceScanNavigation>();
  const { employee } = route.params;

  const cameraRef = useRef<CameraView>(null);
  const [companyName, setCompanyName] = useState("");
  const [apiPhase, setApiPhase] = useState<ApiPhase>("none");
  const [scanState, setScanState] = useState<KioskScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captureKey, setCaptureKey] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showManager, setShowManager] = useState(false);

  const initials = employeeInitials(employee.full_name);
  const avatarBg = avatarColor(employee.full_name);
  const showUsePin = attempts >= 1 && !showManager;

  useEffect(() => {
    void getTabletConfig().then((config) => {
      if (config?.company_name) setCompanyName(config.company_name);
    });
  }, []);

  useEffect(() => {
    if (apiPhase !== "failed") return;
    const timer = setTimeout(() => {
      setApiPhase("none");
      setScanState("idle");
      setErrorMessage(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [apiPhase]);

  useEffect(() => {
    setScanState("idle");
    setApiPhase("none");
  }, [captureKey]);

  const handleBack = useCallback(() => {
    navigation.replace("Idle");
  }, [navigation]);

  const handleCaptureFailed = useCallback((message?: string | null) => {
    setAttempts((prev) => {
      const next = prev + 1;
      if (next >= MAX_ATTEMPTS) setShowManager(true);
      return next;
    });
    void hapticError();
    if (message) setErrorMessage(message);
    setApiPhase("failed");
    setCaptureKey((k) => k + 1);
  }, []);

  const handleCapture = useCallback(async () => {
    if (scanState !== "idle" || apiPhase !== "none") return;

    setErrorMessage(null);
    setScanState("detecting");

    if (isExpoGo() || !cameraRef.current) {
      setScanState("failed_no_face");
      handleCaptureFailed();
      return;
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      base64: false,
      exif: false,
    });

    if (!photo?.uri) {
      setScanState("failed_no_face");
      handleCaptureFailed();
      return;
    }

    const detection = await detectAndCropFace(
      photo.uri,
      photo.width ?? 1,
      photo.height ?? 1
    );

    if (!detection.success) {
      setScanState(faceDetectionReasonToScanState(detection.reason));
      handleCaptureFailed();
      return;
    }

    setScanState("processing");
    setApiPhase("processing");

    try {
      const tabletToken = await getTabletToken();
      // Send the full photo — InsightFace re-runs detection and needs resolution context.
      const formData = buildFaceUploadFormData(photo.uri, employee.id);

      const { data } = await api.post<VerifyFaceResponse>(
        "/api/kiosk/verify-face",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-tablet-token": tabletToken ?? "",
          },
        }
      );

      if (data.verified) {
        setScanState("success");
        setApiPhase("success");
        void hapticSuccess();
        setTimeout(() => {
          navigation.replace("Action", {
            employee,
            matchScore: data.match_score ?? data.confidence,
          });
        }, 1200);
        return;
      }

      setScanState("failed_no_match");
      handleCaptureFailed();
    } catch (err) {
      setScanState("failed_no_match");
      handleCaptureFailed(getKioskApiErrorMessage(err, ""));
    }
  }, [
    apiPhase,
    employee,
    handleCaptureFailed,
    navigation,
    scanState,
  ]);

  if (showManager) {
    return (
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={styles.managerScroll}
          showsVerticalScrollIndicator={false}
        >
          <Feather name="alert-circle" size={56} color={T.error} />
          <Text style={styles.managerTitle}>Please see your manager</Text>
          <Text style={styles.managerBody}>
            We could not verify your identity. A team member can help you clock
            in manually.
          </Text>
          <Pressable
            onPress={handleBack}
            onPressIn={() => onPressHaptic("medium")}
            style={({ pressed }) => [
              styles.managerBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.managerBtnText}>Return to Home</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.replace("Pin")}
            onPressIn={() => onPressHaptic("light")}
            style={({ pressed }) => [styles.pinBtn, pressed && styles.pressed]}
          >
            <Text style={styles.pinBtnText}>Use PIN</Text>
          </Pressable>
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <View style={styles.root}>
      <FaceCaptureView
        mode="verify"
        title="Face Verification"
        employeeName={employee.full_name}
        companyName={companyName || "Elitebase"}
        initials={initials}
        avatarColor={avatarBg}
        successTitle="Verified!"
        successSubtitle="Proceeding..."
        apiPhase={apiPhase}
        resetKey={captureKey}
        errorMessage={errorMessage}
        cameraRef={cameraRef}
        scanState={scanState}
        onBack={handleBack}
        onUsePin={
          showUsePin ? () => navigation.replace("Pin") : undefined
        }
        onCapturePress={handleCapture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  managerScroll: {
    flexGrow: 1,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  managerTitle: { ...T.title, textAlign: "center" },
  managerBody: { ...T.body, fontSize: 16, textAlign: "center" },
  managerBtn: {
    marginTop: 24,
    width: "100%",
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  managerBtnText: { ...T.btn, color: "#fff" },
  pinBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceHi,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBtnText: { ...T.btn, color: T.textMuted },
  pressed: { opacity: 0.88 },
});
