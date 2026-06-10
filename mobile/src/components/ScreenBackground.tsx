import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type ScreenBackgroundProps = {
  children: ReactNode;
  colors?: readonly [string, string];
  style?: ViewStyle;
};

const DEFAULT_COLORS = ["#0a0a0f", "#020203"] as const;

export function ScreenBackground({
  children,
  colors = DEFAULT_COLORS,
  style,
}: ScreenBackgroundProps) {
  return (
    <LinearGradient colors={[...colors]} style={[styles.root, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
