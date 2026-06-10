import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export type KioskTypography = {
  base: number;
  heading: number;
  largeHeading: number;
  iconSm: number;
  iconMd: number;
  iconLg: number;
  avatarSm: number;
  avatarMd: number;
  avatarLg: number;
};

/** Minimum touch target for primary kiosk actions */
export const KIOSK_BUTTON_MIN_HEIGHT = 56;

export function getKioskTypography(width: number): KioskTypography {
  if (width < 380) {
    return {
      base: 14,
      heading: 20,
      largeHeading: 24,
      iconSm: 18,
      iconMd: 24,
      iconLg: 32,
      avatarSm: 40,
      avatarMd: 48,
      avatarLg: 64,
    };
  }
  if (width <= 600) {
    return {
      base: 15,
      heading: 22,
      largeHeading: 28,
      iconSm: 20,
      iconMd: 28,
      iconLg: 40,
      avatarSm: 44,
      avatarMd: 56,
      avatarLg: 72,
    };
  }
  return {
    base: 16,
    heading: 24,
    largeHeading: 32,
    iconSm: 22,
    iconMd: 32,
    iconLg: 48,
    avatarSm: 48,
    avatarMd: 64,
    avatarLg: 96,
  };
}

export function useKioskTypography(): KioskTypography {
  const { width } = useWindowDimensions();
  return useMemo(() => getKioskTypography(width), [width]);
}
