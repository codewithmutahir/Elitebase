import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type KioskLayout = {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isCompact: boolean;
  contentMaxWidth: number;
  keypadWidth: number;
  keySize: number;
  keyGap: number;
  paddingH: number;
  paddingTop: number;
  paddingBottom: number;
  /** Face guide oval width (4:5 aspect). */
  faceOvalW: number;
  faceOvalH: number;
};

const KEY_GAP = 12;

export function getKioskLayout(
  width: number,
  height: number,
  insets: { top: number; bottom: number; left: number; right: number }
): KioskLayout {
  const isLandscape = width > height;
  const shortest = Math.min(width, height);
  const isTablet = shortest >= 600;
  const isCompact = height < 700 || (isLandscape && height < 500);

  const paddingH = Math.max(insets.left, insets.right, isTablet ? 32 : 20);
  const paddingTop = Math.max(insets.top, 12) + (isCompact ? 8 : 16);
  const paddingBottom = Math.max(insets.bottom, 12) + (isCompact ? 8 : 16);

  const usableWidth = Math.max(280, width - paddingH * 2);

  const contentMaxWidth = isTablet
    ? Math.min(560, usableWidth)
    : Math.min(440, usableWidth);

  const availableH = Math.max(
    220,
    height - paddingTop - paddingBottom - (isLandscape ? 56 : 72)
  );
  const maxFromHeight = Math.floor((availableH - KEY_GAP * 3) / 4);
  const keypadCap = isLandscape
    ? Math.min(380, Math.max(200, Math.min(width * 0.42, availableH)))
    : Math.min(360, usableWidth);

  const keySize = Math.min(
    isTablet ? 92 : 84,
    Math.max(
      48,
      Math.min(Math.floor((keypadCap - KEY_GAP * 2) / 3), maxFromHeight)
    )
  );
  const keypadWidth = keySize * 3 + KEY_GAP * 2;

  // ~4:5 oval sized from the short side so portrait kiosks stay consistent.
  const faceOvalW = Math.round(
    Math.min(
      isTablet ? 300 : 260,
      Math.max(180, shortest * (isCompact ? 0.42 : 0.52))
    )
  );
  const faceOvalH = Math.round(faceOvalW * 1.25);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isCompact,
    contentMaxWidth,
    keypadWidth,
    keySize,
    keyGap: KEY_GAP,
    paddingH,
    paddingTop,
    paddingBottom,
    faceOvalW,
    faceOvalH,
  };
}

export function useKioskLayout(): KioskLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(
    () => getKioskLayout(width, height, insets),
    [width, height, insets]
  );
}
