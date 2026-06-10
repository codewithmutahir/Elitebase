import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  title: string;
  onBack: () => void;
};

export function FaceScannerTopBar({ title, onBack }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        hitSlop={12}
      >
        <Text style={styles.backArrow}>←</Text>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  backPressed: { opacity: 0.65 },
  backArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  backLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  title: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "500",
  },
  rightSpacer: {
    width: 80,
  },
});
