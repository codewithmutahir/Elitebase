import { Easing } from "react-native-reanimated";

export const T = {
  bgDeep: "#020203",
  bgBase: "#050506",
  bgElevated: "#0a0a0c",
  surface: "rgba(255,255,255,0.05)",
  surfaceHi: "rgba(255,255,255,0.08)",
  primary: "#155dfc",
  primaryGlow: "rgba(21,93,252,0.25)",
  primaryBorder: "rgba(21,93,252,0.35)",
  primaryDark: "#1c398e",
  text: "#EDEDEF",
  textMuted: "#8A8F98",
  border: "rgba(255,255,255,0.08)",
  success: "#22c55e",
  successGlow: "rgba(34,197,94,0.25)",
  error: "#ef4444",
  errorGlow: "rgba(239,68,68,0.25)",
  warning: "#f59e0b",
  faceBg: "#000000",

  hero: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 40,
    letterSpacing: -1.2,
    color: "#EDEDEF",
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    letterSpacing: -0.6,
    color: "#EDEDEF",
  },
  h2: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#EDEDEF",
  },
  btn: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#EDEDEF",
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: "#8A8F98",
  },
  label: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#8A8F98",
  },
  numpad: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 28,
    color: "#EDEDEF",
  },

  easing: Easing.bezier(0.16, 1, 0.3, 1),
  spring: { damping: 20, stiffness: 90 } as const,

  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
} as const;

/** @deprecated Use `T` — kept for gradual migration */
export const tokens = {
  bg: T.bgBase,
  surface: T.bgElevated,
  surface2: T.surfaceHi,
  primary: T.primary,
  primaryDim: T.primaryGlow,
  primaryGlow: T.primaryGlow,
  primaryBorder: T.primaryBorder,
  text: T.text,
  textMuted: T.textMuted,
  border: T.border,
  success: T.success,
  error: T.error,
  warning: T.warning,
  faceBg: T.faceBg,
  primaryDark: T.primaryDark,
  fontHero: T.hero,
  fontTitle: T.title,
  fontH2: T.h2,
  fontBtn: T.btn,
  fontBody: T.body,
  fontLabel: T.label,
  fontMono: T.numpad,
  radius: T.radius,
} as const;

export const TRANSITION_MS = 250;
