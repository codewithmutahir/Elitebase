import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { ScanState } from "@/components/face-id/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  scanState: ScanState;
  countdownSeconds: number | null;
  disabled: boolean;
  onPress: () => void;
};

export function FaceCaptureButton({
  scanState,
  countdownSeconds,
  disabled,
  onPress,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const label =
    scanState === "scanning" && countdownSeconds != null
      ? `Auto-capturing in ${countdownSeconds}s...`
      : "Tap to capture";

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 14 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14 });
        }}
        style={[styles.outer, animStyle, disabled && styles.disabled]}
      >
        <View style={styles.inner} />
      </AnimatedPressable>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: "35%",
    alignItems: "center",
  },
  outer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  disabled: {
    opacity: 0.45,
  },
  caption: {
    marginTop: 8,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
