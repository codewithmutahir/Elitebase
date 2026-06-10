import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import {
  FACE_LANDMARKS,
  SCANNER_RADIUS,
  SCANNER_SIZE,
} from "@/components/face-id/constants";

type Props = {
  visible: boolean;
  centerX: number;
  centerY: number;
};

function Dot({ index, visible, cx, cy }: { index: number; visible: boolean; cx: number; cy: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const landmark = FACE_LANDMARKS[index]!;

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(index * 30, withTiming(1, { duration: 280 }));
      scale.value = withDelay(index * 30, withSpring(1, { damping: 14 }));
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.6, { duration: 300 });
    }
  }, [visible, index, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.6,
    transform: [{ scale: scale.value }],
  }));

  const left = cx + landmark.x * (SCANNER_RADIUS * 0.72) - 2;
  const top = cy + landmark.y * (SCANNER_RADIUS * 0.85) - 2;

  return (
    <Animated.View
      style={[styles.dot, style, { left, top }]}
    />
  );
}

export function FaceLandmarkDots({ visible, centerX, centerY }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FACE_LANDMARKS.map((_, i) => (
        <Dot key={i} index={i} visible={visible} cx={centerX} cy={centerY} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
});
