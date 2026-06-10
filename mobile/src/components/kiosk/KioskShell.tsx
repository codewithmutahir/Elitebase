// REFACTORED: portrait-responsive + Reanimated unified
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getKioskPadding, kioskSpace } from "@/constants/kioskLayout";
import { kioskTheme } from "@/constants/kioskTheme";
import { KioskStatusBar } from "@/components/kiosk/KioskStatusBar";

export type KioskShellProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  backgroundColor?: string;
  edgeToEdge?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function KioskShell({
  children,
  header,
  footer,
  backgroundColor = kioskTheme.background,
  edgeToEdge = false,
  contentStyle,
}: KioskShellProps) {
  const insets = useSafeAreaInsets();
  const pad = getKioskPadding(insets);

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <KioskStatusBar />

      {header ? (
        <View
          style={[
            styles.headerZone,
            {
              paddingTop: pad.top,
              paddingLeft: pad.left,
              paddingRight: pad.right,
            },
          ]}
        >
          <View style={styles.headerInner}>{header}</View>
        </View>
      ) : null}

      <View
        style={[
          styles.contentZone,
          !edgeToEdge && {
            paddingLeft: pad.left,
            paddingRight: pad.right,
          },
          !footer && !edgeToEdge && { paddingBottom: pad.bottom },
          contentStyle,
        ]}
      >
        {children}
      </View>

      {footer ? (
        <View
          style={[
            styles.footerZone,
            {
              paddingBottom: pad.bottom,
              paddingLeft: pad.left,
              paddingRight: pad.right,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function useKioskInsets() {
  const insets = useSafeAreaInsets();
  return getKioskPadding(insets);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerZone: {
    backgroundColor: "transparent",
  },
  headerInner: {
    flexShrink: 0,
    justifyContent: "center",
    paddingVertical: kioskSpace.xs,
  },
  contentZone: {
    flex: 1,
    minHeight: 0,
  },
  footerZone: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: kioskSpace.xs,
  },
});
