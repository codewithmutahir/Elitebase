// REFACTORED: portrait-responsive + Reanimated unified
import type { EdgeInsets } from "react-native-safe-area-context";

/** 8px base spacing grid */
export const kioskSpace = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/** Minimum touch target for kiosk primary buttons */
export const KIOSK_BUTTON_MIN_HEIGHT = 56;

export const KIOSK_SPRING = { damping: 18, stiffness: 200 } as const;
export const KIOSK_ENTRANCE_MS = 350;

export type KioskPadding = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  horizontal: number;
};

export function getKioskPadding(insets: EdgeInsets): KioskPadding {
  const left = Math.max(insets.left, kioskSpace.lg);
  const right = Math.max(insets.right, kioskSpace.lg);
  return {
    top: insets.top + kioskSpace.md,
    bottom: insets.bottom + kioskSpace.md,
    left,
    right,
    horizontal: left,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
