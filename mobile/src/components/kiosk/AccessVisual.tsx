import { StyleSheet, Text, View } from "react-native";
import { kioskSpace } from "@/constants/kioskLayout";

type AccessVisualProps = {
  initials: string;
  compact?: boolean;
};

/**
 * Premium kiosk entry visual — company identity, not legacy biometric icons.
 */
export function AccessVisual({ initials, compact = false }: AccessVisualProps) {
  const outer = compact ? 96 : 120;
  const inner = compact ? 72 : 88;

  return (
    <View style={[styles.wrap, { width: outer + 24, height: outer + 24 }]}>
      <View
        style={[
          styles.ringOuter,
          { width: outer + 24, height: outer + 24, borderRadius: (outer + 24) / 2 },
        ]}
      />
      <View
        style={[
          styles.ringMid,
          { width: outer + 8, height: outer + 8, borderRadius: (outer + 8) / 2 },
        ]}
      />
      <View
        style={[
          styles.core,
          { width: inner, height: inner, borderRadius: inner / 2 },
        ]}
      >
        <Text style={[styles.initials, compact && styles.initialsCompact]}>
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "transparent",
  },
  ringMid: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  core: {
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  initials: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  initialsCompact: {
    fontSize: 26,
  },
});
