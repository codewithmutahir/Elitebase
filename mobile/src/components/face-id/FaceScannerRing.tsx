import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  CIRCUMFERENCE,
  COLOR_TRANSITION_MS,
  COLORS,
  SCANNER_RADIUS,
  SCANNER_SIZE,
} from "@/components/face-id/constants";
import type { ScanState } from "@/components/face-id/types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  scanState: ScanState;
  fillProgress: number;
  scannerCenterX: number;
  scannerCenterY: number;
};

export function FaceScannerRing({
  scanState,
  fillProgress,
  scannerCenterX,
  scannerCenterY,
}: Props) {
  const rotation = useSharedValue(0);
  const dashOffset = useSharedValue(CIRCUMFERENCE);
  const ringScale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const colorPhase = useSharedValue(0);
  const isIdle = useSharedValue(1);

  useEffect(() => {
    isIdle.value = scanState === "idle" ? 1 : 0;

    if (scanState === "idle") {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      dashOffset.value = CIRCUMFERENCE;
      colorPhase.value = 0;
      ringScale.value = 1;
      return;
    }

    rotation.value = rotation.value % 360;

    if (scanState === "detecting") {
      colorPhase.value = withTiming(1, { duration: COLOR_TRANSITION_MS });
      dashOffset.value = CIRCUMFERENCE;
      return;
    }

    if (scanState === "scanning") {
      colorPhase.value = withTiming(1, { duration: COLOR_TRANSITION_MS });
      dashOffset.value = CIRCUMFERENCE * (1 - fillProgress);
      return;
    }

    if (scanState === "success") {
      colorPhase.value = withTiming(2, { duration: COLOR_TRANSITION_MS });
      dashOffset.value = withTiming(0, { duration: COLOR_TRANSITION_MS });
      ringScale.value = withSequence(
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 14 })
      );
      return;
    }

    if (scanState === "failed") {
      colorPhase.value = withTiming(3, { duration: COLOR_TRANSITION_MS });
      shakeX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      ringScale.value = withSpring(1);
    }
  }, [scanState, fillProgress, colorPhase, dashOffset, isIdle, ringScale, rotation, shakeX]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { scale: ringScale.value },
    ],
  }));

  const arcProps = useAnimatedProps(() => {
    const stroke = interpolateColor(
      colorPhase.value,
      [0, 1, 2, 3],
      [COLORS.arcIdle, COLORS.blue, COLORS.green, COLORS.red]
    );
    const idle = isIdle.value > 0.5;
    return {
      stroke,
      strokeDashoffset: dashOffset.value,
      strokeDasharray: idle
        ? "10 8"
        : `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      opacity: idle ? 0.85 : 1,
    };
  });

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const cx = SCANNER_RADIUS;
  const cy = SCANNER_RADIUS;

  return (
    <View
      style={[
        styles.wrap,
        {
          left: scannerCenterX - SCANNER_RADIUS,
          top: scannerCenterY - SCANNER_RADIUS,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.ringBox, containerStyle, rotateStyle]}>
        <Svg width={SCANNER_SIZE} height={SCANNER_SIZE}>
          <Circle
            cx={cx}
            cy={cy}
            r={SCANNER_RADIUS}
            stroke={COLORS.track}
            strokeWidth={3}
            fill="none"
          />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={SCANNER_RADIUS}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            rotation={-90}
            origin={`${cx}, ${cy}`}
            animatedProps={arcProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
  },
  ringBox: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
  },
});
