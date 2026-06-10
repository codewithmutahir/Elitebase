// REFACTORED: portrait-responsive + Reanimated unified
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { FingerprintIcon } from "@/components/kiosk/FingerprintIcon";
import { kioskTheme } from "@/constants/kioskTheme";
import { useKioskTypography } from "@/hooks/useKioskTypography";

export function GlowingFingerprint() {
  const { iconLg } = useKioskTypography();
  const pulse = useSharedValue(0.85);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.92 + pulse.value * 0.12 }],
  }));

  const startPulse = useCallback(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [pulse]);

  useFocusEffect(
    useCallback(() => {
      startPulse();
      return () => {
        cancelAnimation(pulse);
        pulse.value = 0.85;
      };
    }, [pulse, startPulse])
  );

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glowOuter, glowStyle]} />
      <View style={styles.glowMid} />
      <View style={styles.core}>
        <FingerprintIcon size={iconLg} color={kioskTheme.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "58%",
    aspectRatio: 1,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  glowOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    backgroundColor: "rgba(21,93,252,0.45)",
    shadowColor: kioskTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 60,
    elevation: 0,
  },
  glowMid: {
    position: "absolute",
    top: "10%",
    left: "10%",
    right: "10%",
    bottom: "10%",
    borderRadius: 9999,
    backgroundColor: "rgba(21,93,252,0.25)",
    shadowColor: kioskTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 0,
  },
  core: {
    position: "absolute",
    top: "18%",
    left: "18%",
    right: "18%",
    bottom: "18%",
    borderRadius: 9999,
    backgroundColor: "rgba(21,93,252,0.15)",
    borderWidth: 1,
    borderColor: "rgba(21,93,252,0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: kioskTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 8,
  },
});
