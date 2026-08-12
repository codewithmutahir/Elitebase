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
import { FACE_API_TIMEOUT_MS } from "@/lib/faceWarmup";
import { getRegisterFaceErrorMessage } from "@/lib/kiosk";
import {
  buildFaceUploadFormDataFromUris,
  faceDetectionReasonToScanState,
} from "@/lib/kioskFaceCapture";
import {
  hapticError,
  hapticMedium,
  hapticSuccess,
  onPressHaptic,
} from "@/lib/kioskUi";
import { isExpoGo } from "@/lib/runtime";
import { getTabletConfig, getTabletToken } from "@/lib/storage";
import type { KioskEmployee, RootStackParamList } from "@/types";

type FaceRegisterRoute = RouteProp<RootStackParamList, "FaceRegister">;
type FaceRegisterNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "FaceRegister"
>;

type Phase = "confirm" | "camera";

const SAMPLE_COUNT = 3;
const SAMPLE_PROMPTS = [
  "Look straight at the camera",
  "Turn slightly left",
  "Turn slightly right",
] as const;

export function FaceRegisterScreen() {
  const route = useRoute<FaceRegisterRoute>();
  const navigation = useNavigation<FaceRegisterNavigation>();
  const { employee } = route.params;

  const needsReenrollment = Boolean(employee.needs_reenrollment);
  // Forced re-scan or prior registration — show confirm first.
  const isReRegister = needsReenrollment || employee.face_registered;

  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>(isReRegister ? "confirm" : "camera");
  const [companyName, setCompanyName] = useState("Your employer");
  const [apiPhase, setApiPhase] = useState<ApiPhase>("none");
  const [scanState, setScanState] = useState<KioskScanState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captureKey, setCaptureKey] = useState(0);
  const [sampleUris, setSampleUris] = useState<string[]>([]);

  const sampleIndex = sampleUris.length;
  const samplePrompt =
    SAMPLE_PROMPTS[Math.min(sampleIndex, SAMPLE_PROMPTS.length - 1)] ??
    SAMPLE_PROMPTS[0];

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

  const submitSamples = useCallback(
    async (uris: string[]) => {
      setScanState("processing");
      setApiPhase("processing");

      try {
        const tabletToken = await getTabletToken();
        const formData = buildFaceUploadFormDataFromUris(uris, employee.id, {
          includeConsent: true,
        });

        await api.post("/api/kiosk/register-face", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-tablet-token": tabletToken ?? "",
          },
          timeout: FACE_API_TIMEOUT_MS,
        });

        setScanState("success");
        setApiPhase("success");
        void hapticSuccess();

        const updatedEmployee: KioskEmployee = {
          ...employee,
          face_consent: true,
          face_registered: true,
          has_face_descriptor: true,
          needs_reenrollment: false,
        };

        setTimeout(() => {
          navigation.replace("Action", { employee: updatedEmployee });
        }, 1200);
      } catch (err) {
        setSampleUris([]);
        setScanState("failed_no_face");
        handleCaptureFailed(getRegisterFaceErrorMessage(err));
      }
    },
    [employee, handleCaptureFailed, navigation]
  );

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

    // Keep full-frame photo for InsightFace (same as verify).
    const nextUris = [...sampleUris, photo.uri];
    setSampleUris(nextUris);
    void hapticMedium();

    if (nextUris.length < SAMPLE_COUNT) {
      setScanState("idle");
      setCaptureKey((k) => k + 1);
      return;
    }

    await submitSamples(nextUris);
  }, [
    apiPhase,
    handleCaptureFailed,
    sampleUris,
    scanState,
    submitSamples,
  ]);

  if (phase === "confirm") {
    return (
      <ScreenBackground>
        <View style={styles.confirmRoot}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Feather
                name={needsReenrollment ? "alert-circle" : "refresh-ccw"}
                size={28}
                color={needsReenrollment ? T.warning : T.primary}
              />
            </View>
            <Text style={styles.confirmTitle}>
              {needsReenrollment
                ? "Please re-scan your face"
                : "Your face is already registered"}
            </Text>
            <Text style={styles.confirmBody}>
              {needsReenrollment
                ? `${employee.full_name}, we upgraded face recognition. Capture three short photos (center, left, right) so clock-in works again.`
                : `${employee.full_name}, we already have a face on file for you. Do you want to capture a new one and replace it?`}
            </Text>

            <Pressable
              onPress={() => {
                void hapticMedium();
                setSampleUris([]);
                setPhase("camera");
              }}
              onPressIn={() => onPressHaptic("medium")}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {needsReenrollment ? "Start face re-scan" : "Re-register Face"}
              </Text>
            </Pressable>

            {!needsReenrollment ? (
              <Pressable
                onPress={() => navigation.replace("FaceScan", { employee })}
                onPressIn={() => onPressHaptic("light")}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryBtnText}>
                  Keep current · Verify instead
                </Text>
              </Pressable>
            ) : null}

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
        title={
          needsReenrollment
            ? "Re-scan Face"
            : isReRegister
              ? "Re-register Face"
              : "Face Registration"
        }
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
        captureHint={`Photo ${sampleIndex + 1} of ${SAMPLE_COUNT} — ${samplePrompt}`}
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
