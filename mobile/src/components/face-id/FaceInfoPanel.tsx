import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, HINT_PILLS } from "@/components/face-id/constants";
import type { ScanState } from "@/components/face-id/types";

type Props = {
  employeeName: string;
  companyName: string;
  initials: string;
  avatarColor: string;
  scanState: ScanState;
  fillProgress: number;
  retryCountdown: number;
  successTitle: string;
  successSubtitle: string;
};

export function FaceInfoPanel({
  employeeName,
  companyName,
  initials,
  avatarColor,
  scanState,
  fillProgress,
  retryCountdown,
  successTitle,
  successSubtitle,
}: Props) {
  const statusScale = useSharedValue(1);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (scanState === "success") {
      statusScale.value = withSpring(1, { damping: 12 });
    }
    if (scanState === "scanning") {
      barWidth.value = withTiming(fillProgress, { duration: 80 });
    } else if (scanState !== "processing") {
      barWidth.value = withTiming(0, { duration: 200 });
    }
  }, [scanState, fillProgress, barWidth, statusScale]);

  const statusIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  const renderStatus = () => {
    switch (scanState) {
      case "idle":
        return (
          <>
            <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            <Text style={styles.statusText}>
              Position your{"\n"}face in the scanner
            </Text>
          </>
        );
      case "detecting":
        return (
          <>
            <View style={styles.spinnerRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.green} />
              <Ionicons name="refresh" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.statusText}>
              Face detected{"\n"}Hold still...
            </Text>
          </>
        );
      case "scanning":
        return (
          <>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.blue} />
            <Text style={styles.statusText}>
              Scanning...{"\n"}Do not move
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, barStyle]} />
            </View>
          </>
        );
      case "processing":
        return (
          <>
            <Ionicons name="hourglass-outline" size={24} color="#FFFFFF" />
            <Text style={styles.statusText}>Verifying...{"\n"}One moment</Text>
          </>
        );
      case "success":
        return (
          <Animated.View style={[styles.successBlock, statusIconStyle]}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.green} />
            <Text style={styles.successTitle}>{successTitle}</Text>
            <Text style={styles.successSub}>{successSubtitle}</Text>
          </Animated.View>
        );
      case "failed":
        return (
          <>
            <Ionicons name="close-circle" size={32} color={COLORS.red} />
            <Text style={styles.failedTitle}>Not recognized</Text>
            <Text style={styles.successSub}>
              {retryCountdown > 0
                ? `Retrying in ${retryCountdown}s...`
                : "Please try again"}
            </Text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.panel}>
      <LinearGradient
        colors={["rgba(0,0,0,0.82)", "rgba(0,0,0,0.75)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{employeeName}</Text>
        <Text style={styles.company}>{companyName}</Text>
        <View style={styles.divider} />
        <View style={styles.statusSection}>{renderStatus()}</View>
        <View style={styles.hints}>
          {HINT_PILLS.map((pill) => (
            <View key={pill.text} style={styles.pill}>
              <Text style={styles.pillText}>
                {pill.emoji}  {pill.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  name: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  company: {
    marginTop: 4,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 24,
  },
  statusSection: {
    marginTop: 24,
    gap: 12,
    minHeight: 100,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  spinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.blue,
    borderRadius: 2,
  },
  successBlock: {
    gap: 8,
  },
  successTitle: {
    color: COLORS.green,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  successSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  failedTitle: {
    color: COLORS.red,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  hints: {
    marginTop: "auto",
    paddingTop: 24,
    gap: 8,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
