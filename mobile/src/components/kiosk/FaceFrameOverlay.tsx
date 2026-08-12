import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { KioskScanState } from "@/components/kiosk/types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CORNER_LEN = 28;
const CORNER_STROKE = 3;

type FaceFrameOverlayProps = {
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  state: KioskScanState;
};

function CornerGuides({
  x,
  y,
  w,
  h,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}) {
  const right = x + w;
  const bottom = y + h;
  const c = color;

  return (
    <>
      <View style={[styles.cornerTL, { left: x, top: y, borderColor: c }]} />
      <View style={[styles.cornerTR, { left: right - CORNER_LEN, top: y, borderColor: c }]} />
      <View style={[styles.cornerBL, { left: x, top: bottom - CORNER_LEN, borderColor: c }]} />
      <View style={[styles.cornerBR, { left: right - CORNER_LEN, top: bottom - CORNER_LEN, borderColor: c }]} />
    </>
  );
}

export function FaceFrameOverlay({
  frameX,
  frameY,
  frameWidth,
  frameHeight,
  state,
}: FaceFrameOverlayProps) {
  const cx = frameX + frameWidth / 2;
  const cy = frameY + frameHeight / 2;
  const radius = Math.min(frameWidth, frameHeight) / 2 + 12;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const ringOpacity = useSharedValue(0.85);

  const isActive =
    state === "capturing" ||
    state === "detecting" ||
    state === "processing";

  const isSuccess = state === "success";
  const isFailed =
    state === "failed_no_face" ||
    state === "failed_multiple" ||
    state === "failed_too_small" ||
    state === "failed_no_match" ||
    state === "failed_service";

  useEffect(() => {
    if (state === "idle") {
      progress.value = 0;
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1200 }),
          withTiming(0.9, { duration: 1200 })
        ),
        -1,
        true
      );
      return;
    }

    if (isActive) {
      ringOpacity.value = 1;
      progress.value = withRepeat(
        withTiming(0.75, { duration: 1400 }),
        -1,
        true
      );
      return;
    }

    if (isSuccess) {
      ringOpacity.value = 1;
      progress.value = withTiming(1, { duration: 400 });
      return;
    }

    if (isFailed) {
      progress.value = withTiming(0, { duration: 200 });
      ringOpacity.value = 1;
    }
  }, [state, isActive, isFailed, isSuccess, progress, ringOpacity]);

  const strokeColor = (() => {
    if (isSuccess) return "#34D399";
    if (isFailed) return "#EF4444";
    if (isActive) return "#2563EB";
    return "rgba(255,255,255,0.75)";
  })();

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    opacity: ringOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <CornerGuides
        x={frameX}
        y={frameY}
        w={frameWidth}
        h={frameHeight}
        color={strokeColor}
      />

      <Svg
        width={radius * 2 + 8}
        height={radius * 2 + 8}
        style={{
          position: "absolute",
          left: cx - radius - 4,
          top: cy - radius - 4,
        }}
      >
        <Circle
          cx={radius + 4}
          cy={radius + 4}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={3}
          fill="none"
        />
        <AnimatedCircle
          cx={radius + 4}
          cy={radius + 4}
          r={radius}
          stroke={strokeColor}
          strokeWidth={3}
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation={-90}
          origin={`${radius + 4}, ${radius + 4}`}
        />
      </Svg>
    </View>
  );
}

const cornerBase = {
  position: "absolute" as const,
  width: CORNER_LEN,
  height: CORNER_LEN,
};

const styles = StyleSheet.create({
  cornerTL: {
    ...cornerBase,
    borderTopWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
  },
  cornerTR: {
    ...cornerBase,
    borderTopWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
  },
  cornerBL: {
    ...cornerBase,
    borderBottomWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
  },
  cornerBR: {
    ...cornerBase,
    borderBottomWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
  },
});
