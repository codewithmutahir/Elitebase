import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
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
import { FACE_API_TIMEOUT_MS } from "@/lib/faceWarmup";
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

type ClientFailureReason =
  | "NO_FACE_DETECTED"
  | "LOCAL_LOW_CONFIDENCE"
  | "TIMEOUT"
  | "API_ERROR";

const MAX_ATTEMPTS = 3;

async function logClientFaceFailure(
  employeeId: string,
  failureReason: ClientFailureReason,
  detail?: string
) {
  try {
    const tabletToken = await getTabletToken();
    await api.post(
      "/api/kiosk/face-verify-log",
      {
        employee_id: employeeId,
        failure_reason: failureReason,
        detail: detail ?? null,
      },
      {
        headers: {
          "x-tablet-token": tabletToken ?? "",
        },
        timeout: 8000,
      }
    );
  } catch {
    // Instrumentation must never block the kiosk UX.
  }
}

function classifyVerifyTransportError(err: unknown): {
  reason: ClientFailureReason;
  message: string;
} {
  if (axios.isAxiosError(err) && !err.response) {
    const isTimeout =
      err.code === "ECONNABORTED" ||
      /timeout/i.test(String(err.message ?? ""));
    return {
      reason: isTimeout ? "TIMEOUT" : "API_ERROR",
      message: isTimeout
        ? "Face service timed out. Please try again in a moment."
        : "Could not reach face service. Check network and try again.",
    };
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 503 || status >= 500) {
      return {
        reason: "API_ERROR",
        message:
          getKioskApiErrorMessage(
            err,
            "Face service is temporarily unavailable. Please try again."
          ) || "Face service is temporarily unavailable. Please try again.",
      };
    }

    // Client/validation errors (e.g. missing file) are not a downed service.
    if (status >= 400 && status < 500) {
      return {
        reason: "API_ERROR",
        message: getKioskApiErrorMessage(
          err,
          "Could not verify face. Please try again."
        ),
      };
    }
  }

  return {
    reason: "API_ERROR",
    message: getKioskApiErrorMessage(
      err,
      "Face service error. Please try again."
    ),
  };
}

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
  const [showServiceIssue, setShowServiceIssue] = useState(false);

  const initials = employeeInitials(employee.full_name);
  const avatarBg = avatarColor(employee.full_name);
  const showUsePin = attempts >= 1 && !showManager && !showServiceIssue;

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

  /** Match / detection failures count toward the manager screen. */
  const handleMatchFailed = useCallback((message?: string | null) => {
    setShowServiceIssue(false);
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

  /** Service/timeout failures do NOT burn match attempts. */
  const handleServiceFailed = useCallback((message: string) => {
    setShowManager(false);
    setShowServiceIssue(true);
    void hapticError();
    setErrorMessage(message);
    setScanState("failed_service");
    setApiPhase("failed");
    setCaptureKey((k) => k + 1);
  }, []);

  const handleCapture = useCallback(async () => {
    if (scanState !== "idle" || apiPhase !== "none") return;

    setErrorMessage(null);
    setShowServiceIssue(false);
    setScanState("detecting");

    if (isExpoGo() || !cameraRef.current) {
      setScanState("failed_no_face");
      void logClientFaceFailure(
        employee.id,
        "NO_FACE_DETECTED",
        "expo_go_or_missing_camera"
      );
      handleMatchFailed();
      return;
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      base64: false,
      exif: false,
    });

    if (!photo?.uri) {
      setScanState("failed_no_face");
      void logClientFaceFailure(
        employee.id,
        "NO_FACE_DETECTED",
        "empty_photo"
      );
      handleMatchFailed();
      return;
    }

    const detection = await detectAndCropFace(
      photo.uri,
      photo.width ?? 1,
      photo.height ?? 1
    );

    if (!detection.success) {
      setScanState(faceDetectionReasonToScanState(detection.reason));
      const clientReason: ClientFailureReason =
        detection.reason === "too_small"
          ? "LOCAL_LOW_CONFIDENCE"
          : "NO_FACE_DETECTED";
      void logClientFaceFailure(employee.id, clientReason, detection.reason);
      handleMatchFailed();
      return;
    }

    setScanState("processing");
    setApiPhase("processing");

    try {
      const tabletToken = await getTabletToken();
      const formData = buildFaceUploadFormData(photo.uri, employee.id);

      const { data } = await api.post<VerifyFaceResponse>(
        "/api/kiosk/verify-face",
        formData,
        {
          headers: {
            "x-tablet-token": tabletToken ?? "",
          },
          timeout: FACE_API_TIMEOUT_MS,
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
      handleMatchFailed("Face not recognized. Try again.");
    } catch (err) {
      const classified = classifyVerifyTransportError(err);
      void logClientFaceFailure(
        employee.id,
        classified.reason,
        axios.isAxiosError(err) ? err.message : classified.reason
      );
      const isTransportIssue =
        classified.reason === "TIMEOUT" ||
        (axios.isAxiosError(err) &&
          (!err.response ||
            err.response.status === 503 ||
            (err.response.status ?? 0) >= 500));

      if (isTransportIssue) {
        handleServiceFailed(classified.message);
      } else {
        setScanState("failed_no_match");
        handleMatchFailed(classified.message);
      }
    }
  }, [
    apiPhase,
    employee,
    handleMatchFailed,
    handleServiceFailed,
    navigation,
    scanState,
  ]);

  if (showServiceIssue) {
    return (
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={styles.managerScroll}
          showsVerticalScrollIndicator={false}
        >
          <Feather name="wifi-off" size={56} color={T.warning} />
          <Text style={styles.managerTitle}>Face service unavailable</Text>
          <Text style={styles.managerBody}>
            {errorMessage ??
              "We could not reach face recognition right now. This is a temporary service issue — not a failed identity check."}
          </Text>
          <Pressable
            onPress={() => {
              setShowServiceIssue(false);
              setErrorMessage(null);
              setApiPhase("none");
              setScanState("idle");
              setCaptureKey((k) => k + 1);
            }}
            onPressIn={() => onPressHaptic("medium")}
            style={({ pressed }) => [
              styles.managerBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.managerBtnText}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.replace("Pin")}
            onPressIn={() => onPressHaptic("light")}
            style={({ pressed }) => [styles.pinBtn, pressed && styles.pressed]}
          >
            <Text style={styles.pinBtnText}>Use PIN clock-in path</Text>
          </Pressable>
          <Pressable
            onPress={handleBack}
            onPressIn={() => onPressHaptic("light")}
            style={styles.cancelLink}
          >
            <Text style={styles.cancelText}>Return to Home</Text>
          </Pressable>
        </ScrollView>
      </ScreenBackground>
    );
  }

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
  managerTitle: { ...T.title, textAlign: "center", maxWidth: 480, width: "100%" },
  managerBody: {
    ...T.body,
    fontSize: 16,
    textAlign: "center",
    maxWidth: 480,
    width: "100%",
  },
  managerBtn: {
    marginTop: 24,
    width: "100%",
    maxWidth: 480,
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  managerBtnText: { ...T.btn, color: "#fff" },
  pinBtn: {
    width: "100%",
    maxWidth: 480,
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceHi,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBtnText: { ...T.btn, color: T.textMuted },
  cancelLink: { minHeight: 44, justifyContent: "center" },
  cancelText: { ...T.body, color: T.textMuted },
  pressed: { opacity: 0.88 },
});
