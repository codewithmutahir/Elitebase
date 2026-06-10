import { useCallback, useEffect, type RefObject } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Ellipse } from "react-native-svg";
import type { KioskScanState } from "@/components/kiosk/types";
import { T } from "@/constants/tokens";
import { avatarColor, employeeInitials } from "@/lib/format";
import {
  hapticHeavy,
  hapticError,
  hapticSuccess,
  onPressHaptic,
} from "@/lib/kioskUi";
import type { ApiPhase } from "@/components/face-id/types";

export type { KioskScanState } from "@/components/kiosk/types";

export type KioskFaceScannerProps = {
  title: string;
  employeeName: string;
  employeeId?: string;
  companyName: string;
  initials: string;
  avatarColor: string;
  successTitle: string;
  successSubtitle: string;
  apiPhase: ApiPhase;
  resetKey?: number;
  mode?: "register" | "verify";
  /** When set, overrides the generic failed-status text with the real reason. */
  errorMessage?: string | null;
  cameraRef: RefObject<CameraView | null>;
  scanState: KioskScanState;
  onBack: () => void;
  onUsePin?: () => void;
  onCapturePress: () => void | Promise<void>;
};

const OVAL_W = 240;
const OVAL_H = 300;
const BRACKET = 36;

function CornerBracket({ style }: { style: object }) {
  return <View style={[styles.bracket, style]} />;
}

function statusMessage(state: KioskScanState, mode: "register" | "verify"): string {
  switch (state) {
    case "idle":
      return "📷 Tap to capture";
    case "capturing":
    case "detecting":
      return "⏳ Detecting face...";
    case "processing":
      return "🔍 Analyzing...";
    case "success":
      return mode === "register" ? "✅ Face registered!" : "✅ Verified!";
    case "failed_no_face":
    case "failed_too_small":
      return "⚠️ No face — move closer";
    case "failed_multiple":
      return "⚠️ One face only";
    case "failed_no_match":
      return "❌ Not recognized";
    default:
      return "";
  }
}

export function KioskFaceScanner({
  title,
  employeeName,
  initials,
  avatarColor: avatarBg,
  apiPhase,
  resetKey = 0,
  mode = "register",
  errorMessage,
  cameraRef,
  scanState,
  onBack,
  onUsePin,
  onCapturePress,
}: KioskFaceScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const frameShake = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const displayState: KioskScanState =
    apiPhase === "processing"
      ? "processing"
      : apiPhase === "success"
        ? "success"
        : apiPhase === "failed" && mode === "verify"
          ? "failed_no_match"
          : scanState;

  const captureEnabled = displayState === "idle" && apiPhase === "none";
  const isFailed =
    displayState.startsWith("failed") || apiPhase === "failed";
  const isSuccess = displayState === "success" || apiPhase === "success";
  const isActive =
    displayState === "capturing" ||
    displayState === "detecting" ||
    displayState === "processing";

  useEffect(() => {
    if (!permission?.granted) void requestPermission();
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    frameShake.value = 0;
    checkScale.value = 0;
  }, [resetKey, checkScale, frameShake]);

  useEffect(() => {
    if (isSuccess) {
      checkScale.value = withSequence(
        withSpring(1.3, { damping: 12, stiffness: 100 }),
        withSpring(1, T.spring)
      );
      void hapticSuccess();
    }
    if (isFailed) {
      frameShake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      void hapticError();
    }
  }, [checkScale, frameShake, isFailed, isSuccess]);

  const frameShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: frameShake.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handleCapture = useCallback(() => {
    if (!captureEnabled || !cameraRef.current) return;
    void hapticHeavy();
    void onCapturePress();
  }, [cameraRef, captureEnabled, onCapturePress]);

  const strokeColor = isSuccess
    ? T.success
    : isFailed
      ? T.error
      : isActive
        ? T.primary
        : "rgba(255,255,255,0.35)";

  const strokeWidth = isSuccess || displayState === "processing" ? 4 : isActive ? 3 : 2;

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          active={apiPhase === "none" || apiPhase === "processing"}
        />
      ) : (
        <View style={styles.cameraFallback} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.65)", "transparent"]}
        style={styles.topGrad}
        pointerEvents="none"
      />

      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable
          onPress={onBack}
          onPressIn={() => onPressHaptic("light")}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Feather name="x" size={20} color={T.text} />
        </Pressable>
        <View style={styles.titleBadge}>
          <Text style={styles.titleBadgeText}>{title.toUpperCase()}</Text>
        </View>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <Animated.View
        style={[styles.faceCenter, frameShakeStyle]}
        pointerEvents="box-none"
      >
        {displayState === "idle" && apiPhase === "none" ? (
          <View style={styles.instructionPill}>
            <Text style={styles.instructionText}>Position face in frame</Text>
          </View>
        ) : null}

        <View style={styles.ovalWrap}>
          <Svg width={OVAL_W} height={OVAL_H}>
            <Ellipse
              cx={OVAL_W / 2}
              cy={OVAL_H / 2}
              rx={OVAL_W / 2 - 5}
              ry={OVAL_H / 2 - 5}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={
                displayState === "idle" && !isActive ? "8,5" : undefined
              }
              fill="none"
            />
          </Svg>

          <CornerBracket
            style={{
              width: BRACKET,
              height: BRACKET,
              top: 0,
              left: 0,
              borderTopWidth: 2,
              borderLeftWidth: 2,
            }}
          />
          <CornerBracket
            style={{
              width: BRACKET,
              height: BRACKET,
              top: 0,
              right: 0,
              borderTopWidth: 2,
              borderRightWidth: 2,
            }}
          />
          <CornerBracket
            style={{
              width: BRACKET,
              height: BRACKET,
              bottom: 0,
              left: 0,
              borderBottomWidth: 2,
              borderLeftWidth: 2,
            }}
          />
          <CornerBracket
            style={{
              width: BRACKET,
              height: BRACKET,
              bottom: 0,
              right: 0,
              borderBottomWidth: 2,
              borderRightWidth: 2,
            }}
          />

          {isSuccess ? (
            <Animated.View style={[styles.centerIcon, checkStyle]}>
              <Feather name="check" size={56} color={T.success} />
            </Animated.View>
          ) : isFailed ? (
            <Animated.View style={styles.centerIcon}>
              <Feather name="x" size={48} color={T.error} />
            </Animated.View>
          ) : isActive ? (
            <View style={styles.centerIcon}>
              <ActivityIndicator size="large" color={T.primary} />
            </View>
          ) : null}
        </View>

        <View style={styles.statusPill}>
          <Text style={styles.statusText}>
            {isFailed && errorMessage
              ? `⚠️ ${errorMessage}`
              : statusMessage(displayState, mode)}
          </Text>
        </View>
      </Animated.View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={styles.bottomGrad}
        pointerEvents="box-none"
      />

      <View style={styles.bottomBar}>
        <View style={styles.employeeRow}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>
              {initials || employeeInitials(employeeName)}
            </Text>
          </View>
          <View>
            <Text style={styles.empName} numberOfLines={1}>
              {employeeName}
            </Text>
            <Text style={styles.empHint}>Tap below to capture</Text>
          </View>
        </View>

        <Pressable
          onPress={handleCapture}
          disabled={!captureEnabled}
          onPressIn={() => onPressHaptic("heavy")}
          style={({ pressed }) => [
            styles.captureOuter,
            !captureEnabled && styles.captureDisabled,
            pressed && captureEnabled && styles.pressed,
          ]}
        >
          <View style={styles.captureInner}>
            <Feather name="camera" size={28} color={T.primaryDark} />
          </View>
        </Pressable>

        {onUsePin ? (
          <Pressable
            onPress={onUsePin}
            onPressIn={() => onPressHaptic("light")}
            hitSlop={12}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.usePin}>Use PIN instead</Text>
          </Pressable>
        ) : (
          <View style={styles.usePinSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  topGrad: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
  },
  topBar: {
    position: "absolute",
    top: 56,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surfaceHi,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPlaceholder: { width: 44, height: 44 },
  titleBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: T.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  titleBadgeText: { ...T.label, color: T.text },
  faceCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingTop: 40,
  },
  instructionPill: {
    backgroundColor: "rgba(21,93,252,0.15)",
    borderRadius: T.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: T.primaryBorder,
  },
  instructionText: { ...T.btn, fontSize: 13, color: T.text },
  ovalWrap: {
    width: OVAL_W,
    height: OVAL_H,
    alignItems: "center",
    justifyContent: "center",
  },
  bracket: {
    position: "absolute",
    borderColor: T.primary,
  },
  centerIcon: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  statusPill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: T.radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: T.border,
  },
  statusText: { ...T.btn, fontSize: 13, color: T.text },
  bottomGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
    alignItems: "center",
    gap: 16,
    zIndex: 10,
  },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...T.btn, fontSize: 14, color: "#fff" },
  empName: { ...T.btn, fontSize: 15, color: T.text },
  empHint: { ...T.body, fontSize: 12 },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: "rgba(21,93,252,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 25,
    elevation: 10,
  },
  captureDisabled: { opacity: 0.35 },
  usePin: { ...T.body, fontSize: 13, color: T.textMuted },
  usePinSpacer: { height: 20 },
  pressed: { opacity: 0.88 },
});
