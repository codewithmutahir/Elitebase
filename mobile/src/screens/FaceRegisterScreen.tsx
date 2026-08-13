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
import { avatarColor, employeeInitials } from "@/lib/format";
import {
  detectAndCropFace,
  faceQualityMessage,
} from "@/lib/faceDetection";
import { FACE_API_TIMEOUT_MS, registerFaceMultipart, warmupFaceService } from "@/lib/faceWarmup";
import { getRegisterFaceErrorMessage } from "@/lib/kiosk";
import {
  faceDetectionReasonToScanState,
} from "@/lib/kioskFaceCapture";
import {
  hapticError,
  hapticMedium,
  hapticSuccess,
  onPressHaptic,
} from "@/lib/kioskUi";
import { useSoftFaceAutoCapture } from "@/hooks/useSoftFaceAutoCapture";
import { isExpoGo } from "@/lib/runtime";
import { getTabletConfig } from "@/lib/storage";
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
  "Hold still — slight natural tilt is OK",
  "One more frontal shot — eyes on camera",
] as const;

export function FaceRegisterScreen() {
  const route = useRoute<FaceRegisterRoute>();
  const navigation = useNavigation<FaceRegisterNavigation>();
  const { employee } = route.params;

  const needsReenrollment = Boolean(employee.needs_reenrollment);
  const isReRegister = needsReenrollment || employee.face_registered;

  const cameraRef = useRef<CameraView>(null);
  const acceptingRef = useRef(false);
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
  /**
   * Soft auto-capture is OFF for now: continuous takePictureAsync blinks the
   * preview and races manual capture / uploads (seen as connection errors).
   * Quality gates still run on the shutter button path.
   */
  const autoEnabled = false;

  useEffect(() => {
    void getTabletConfig().then((config) => {
      if (config?.company_name) setCompanyName(config.company_name);
    });
  }, []);

  useEffect(() => {
    if (phase === "camera") {
      void warmupFaceService();
    }
  }, [phase]);

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
      setErrorMessage("Waking face service…");

      try {
        // Block until warmup attempt finishes so cold Render is less likely
        // to kill the first real extract request.
        const warm = await warmupFaceService();
        if (!warm.warmed) {
          console.warn("[FaceRegister] warmup incomplete", warm);
        }

        setErrorMessage("Uploading face photos…");
        await registerFaceMultipart({
          uris,
          employeeId: employee.id,
          timeoutMs: FACE_API_TIMEOUT_MS,
        });

        setErrorMessage(null);
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
        sampleUrisRef.current = [];
        setScanState("failed_no_face");
        handleCaptureFailed(
          err instanceof Error
            ? err.message
            : getRegisterFaceErrorMessage(err)
        );
      }
    },
    [employee, handleCaptureFailed, navigation]
  );

  const sampleUrisRef = useRef<string[]>([]);
  sampleUrisRef.current = sampleUris;

  const acceptPreparedFace = useCallback(
    async (croppedUri: string) => {
      if (acceptingRef.current) return;
      if (apiPhase !== "none") return;
      acceptingRef.current = true;
      // Freeze auto/manual re-entry while we bookkeep samples / upload.
      setScanState("processing");

      try {
        const nextUris = [...sampleUrisRef.current, croppedUri];
        sampleUrisRef.current = nextUris;
        setSampleUris(nextUris);
        void hapticMedium();

        if (nextUris.length < SAMPLE_COUNT) {
          setScanState("idle");
          setErrorMessage(null);
          setCaptureKey((k) => k + 1);
          return;
        }

        await submitSamples(nextUris);
      } finally {
        acceptingRef.current = false;
      }
    },
    [apiPhase, submitSamples]
  );

  useSoftFaceAutoCapture({
    enabled: autoEnabled,
    cameraRef,
    requireFrontal: true,
    onAccepted: (result) => {
      void acceptPreparedFace(result.croppedUri);
    },
    onCoaching: (reason) => {
      setErrorMessage(faceQualityMessage(reason));
    },
  });

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
      quality: 0.92,
      base64: false,
      exif: false,
      skipProcessing: false,
      shutterSound: false,
    });

    if (!photo?.uri) {
      setScanState("failed_no_face");
      handleCaptureFailed(faceQualityMessage("no_face"));
      return;
    }

    const detection = await detectAndCropFace(
      photo.uri,
      photo.width ?? 1,
      photo.height ?? 1,
      { requireFrontal: true }
    );

    if (!detection.success) {
      setScanState(faceDetectionReasonToScanState(detection.reason));
      handleCaptureFailed(faceQualityMessage(detection.reason));
      return;
    }

    setScanState("idle");
    await acceptPreparedFace(detection.croppedUri);
  }, [acceptPreparedFace, apiPhase, handleCaptureFailed, scanState]);

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
                ? `${employee.full_name}, we upgraded face recognition. Capture three clear frontal photos so clock-in works again.`
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
        captureHint={`Photo ${sampleIndex + 1} of ${SAMPLE_COUNT} — ${samplePrompt} · tap capture`}
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
    maxWidth: 480,
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
