import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useKioskLayout } from "@/hooks/useKioskLayout";

type KioskFrameProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** When true, content can grow to fill height (default). */
  fill?: boolean;
  maxWidth?: number;
};

/** Centers kiosk UI and caps width so tablets/landscape don't stretch. */
export function KioskFrame({
  children,
  style,
  fill = true,
  maxWidth,
}: KioskFrameProps) {
  const layout = useKioskLayout();
  const cap = maxWidth ?? layout.contentMaxWidth;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingHorizontal: layout.paddingH,
          paddingTop: layout.paddingTop,
          paddingBottom: layout.paddingBottom,
        },
      ]}
    >
      <View
        style={[
          fill ? styles.innerFill : styles.inner,
          { maxWidth: cap, width: "100%" },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
  },
  innerFill: {
    flex: 1,
    width: "100%",
  },
  inner: {
    width: "100%",
  },
});
