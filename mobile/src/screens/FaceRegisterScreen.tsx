import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import { FaceCaptureView } from "@/components/FaceCaptureView";
import { ScreenBackground } from "@/components/ScreenBackground";
import { T } from "@/constants/tokens";
import type { KioskScanState } from "@/components/kiosk/types";
import type { ApiPhase } from "@/components/face-id/types";
import { api } from "@/lib/api";
import { avatarColor, employeeInitials } from "@/lib/format";
import { detectAndCropFace } from "@/lib/faceDetection";
import { getRegisterFaceErrorMessage } from "@/lib/kiosk";
import {
  buildFaceUploadFormData,
  faceDetectionReasonToScanState,
} from "@/lib/kioskFaceCapture";
import { hapticError, hapticMedium, hapticSuccess, onPressHaptic } from "@/lib/kioskUi";
import { isExpoGo } from "@/lib/runtime";
import { getTabletConfig, getTabletToken } from "@/lib/storage";
import type { KioskEmployee, RootStackParamList } from "@/types";

type FaceRegisterRoute = RouteProp<RootStackParamList, "FaceRegister">;
type FaceRegisterNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "FaceRegister"
>;

type Phase = "confirm" | "camera";

export function FaceRegisterScreen() {
  const route = useRoute<FaceRegisterRoute>();
  const navigation = useNavigation<FaceRegisterNavigation>();
  const { employee } = route.params;

  // Employees who registered before (e.g. descriptor reset by a migration) get a
  // re-register confirmation instead of being silently re-enrolled.
  const isReRegister = employee.face_registered;

  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>(isReRegister ? "confirm" : "camera");
  const [companyName, setCompanyName] = useState("Your employer");
  const [apiPhase, setApiPhase] = useState<ApiPhase>("none");
  const [scanState, setScanState] = useState<KioskScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captureKey, setCaptureKey] = useState(0);

  const initials = employeeInitials(employee.full_name);
  const avatarBg = avatarColor(employee.full_name);

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
      const formData = buildFaceUploadFormData(photo.uri, employee.id, {
        includeConsent: true,
      });

      await api.post("/api/kiosk/register-face", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-tablet-token": tabletToken ?? "",
        },
      });

      setScanState("success");
      setApiPhase("success");
      void hapticSuccess();

      const updatedEmployee: KioskEmployee = {
        ...employee,
        face_consent: true,
        face_registered: true,
        has_face_descriptor: true,
      };

      setTimeout(() => {
        navigation.replace("Action", { employee: updatedEmployee });
      }, 1200);
    } catch (err) {
      setScanState("failed_no_face");
      handleCaptureFailed(getRegisterFaceErrorMessage(err));
    }
  }, [
    apiPhase,
    employee,
    handleCaptureFailed,
    navigation,
    scanState,
  ]);

  if (phase === "confirm") {
    return (
      <ScreenBackground>
        <View style={styles.confirmRoot}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Feather name="refresh-ccw" size={28} color={T.primary} />
            </View>
            <Text style={styles.confirmTitle}>Your face is already registered</Text>
            <Text style={styles.confirmBody}>
              {employee.full_name}, we already have a face on file for you. Do you
              want to capture a new one and replace it?
            </Text>

            <Pressable
              onPress={() => {
                void hapticMedium();
                setPhase("camera");
              }}
              onPressIn={() => onPressHaptic("medium")}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>Re-register Face</Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.replace("FaceScan", { employee })}
              onPressIn={() => onPressHaptic("light")}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Keep current · Verify instead</Text>
            </Pressable>

            <Pressable
              onPress={handleBack}
              onPressIn={() => onPressHaptic("light")}
              hitSlop={8}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <View style={styles.root}>
      <FaceCaptureView
        mode="register"
        title={isReRegister ? "Re-register Face" : "Face Registration"}
        employeeName={employee.full_name}
        employeeId={employee.id}
        companyName={companyName}
        initials={initials}
        avatarColor={avatarBg}
        successTitle="Face Registered!"
        successSubtitle="Proceeding..."
        apiPhase={apiPhase}
        resetKey={captureKey}
        errorMessage={errorMessage}
        cameraRef={cameraRef}
        scanState={scanState}
        onBack={handleBack}
        onCapturePress={handleCapture}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  confirmRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: "100%",
    backgroundColor: T.surface,
    borderRadius: T.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.primaryGlow,
    borderWidth: 1,
    borderColor: T.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    ...T.h2,
    textAlign: "center",
    marginTop: 4,
  },
  confirmBody: {
    ...T.body,
    textAlign: "center",
    marginBottom: 8,
  },
  primaryBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { ...T.btn, color: "#fff" },
  secondaryBtn: {
    width: "100%",
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceHi,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { ...T.btn, color: T.text },
  cancelBtn: { minHeight: 44, justifyContent: "center" },
  cancelText: { ...T.body, color: T.textMuted },
  pressed: { opacity: 0.88 },
});
