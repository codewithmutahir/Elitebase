export const SCANNER_RADIUS = 130;
export const SCANNER_SIZE = 260;
export const CIRCUMFERENCE = 2 * Math.PI * SCANNER_RADIUS;

export const ARC_FILL_MS = 1500;
export const STEADY_MS = 1500;
export const FAILED_RESET_MS = 2000;
export const SUCCESS_HOLD_MS = 1000;
export const COLOR_TRANSITION_MS = 300;

export const COLORS = {
  black: "#000000",
  blue: "#2563EB",
  green: "#10B981",
  red: "#EF4444",
  whiteMuted: "rgba(255,255,255,0.5)",
  track: "rgba(255,255,255,0.15)",
  arcIdle: "rgba(255,255,255,0.3)",
} as const;

export const HINT_PILLS = [
  { emoji: "💡", text: "Good lighting" },
  { emoji: "👁", text: "Look straight" },
  { emoji: "🧍", text: "Keep distance" },
] as const;

/** Oval landmark layout (normalized -1..1 inside circle). */
export const FACE_LANDMARKS = [
  { x: -0.35, y: -0.28 },
  { x: 0.35, y: -0.28 },
  { x: 0, y: -0.05 },
  { x: -0.22, y: 0.12 },
  { x: 0.22, y: 0.12 },
  { x: 0, y: 0.32 },
  { x: -0.42, y: 0.05 },
  { x: 0.42, y: 0.05 },
  { x: 0, y: -0.42 },
  { x: -0.18, y: 0.38 },
  { x: 0.18, y: 0.38 },
  { x: 0, y: 0.48 },
] as const;
