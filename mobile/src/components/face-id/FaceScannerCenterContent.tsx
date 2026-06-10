import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/components/face-id/constants";
import type { ScanState } from "@/components/face-id/types";

type Props = {
  scanState: ScanState;
  fillPercent: number;
  centerX: number;
  centerY: number;
};

function LoadingDots() {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <LoadingDot key={i} index={i} />
      ))}
    </View>
  );
}

function LoadingDot({ index }: { index: number }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 350 }),
          withTiming(0.6, { duration: 350 })
        ),
        -1,
        false
      )
    );
  }, [index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.loadingDot, style]} />;
}

export function FaceScannerCenterContent({
  scanState,
  fillPercent,
  centerX,
  centerY,
}: Props) {
  const markScale = useSharedValue(0);

  useEffect(() => {
    if (scanState === "success" || scanState === "failed") {
      markScale.value = withSpring(1, { damping: 12 });
    } else {
      markScale.value = withTiming(0, { duration: 120 });
    }
  }, [scanState, markScale]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markScale.value }],
  }));

  return (
    <View
      style={[
        styles.wrap,
        { left: centerX - 60, top: centerY - 48, width: 120, height: 96 },
      ]}
      pointerEvents="none"
    >
      {scanState === "idle" && (
        <>
          <Ionicons name="scan-outline" size={32} color="rgba(255,255,255,0.5)" />
          <Text style={styles.hint}>Position face</Text>
        </>
      )}

      {scanState === "detecting" && <LoadingDots />}

      {scanState === "scanning" && (
        <Text style={styles.percent}>{Math.round(fillPercent)}%</Text>
      )}

      {scanState === "processing" && <LoadingDots />}

      {scanState === "success" && (
        <Animated.View style={markStyle}>
          <Ionicons name="checkmark-circle" size={40} color={COLORS.green} />
        </Animated.View>
      )}

      {scanState === "failed" && (
        <Animated.View style={markStyle}>
          <Ionicons name="close-circle" size={40} color={COLORS.red} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    marginTop: 8,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  percent: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});
