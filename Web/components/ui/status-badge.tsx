"use client";

import MuiChip from "@mui/material/Chip";
import type { ChipProps as MuiChipProps } from "@mui/material/Chip";
import type { ReactNode } from "react";

export type StatusTone =
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const toneToColor: Record<StatusTone, MuiChipProps["color"]> = {
  accent: "primary",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  neutral: "default",
};

export function StatusBadge({
  tone = "neutral",
  theme: _theme = "light",
  className,
  children,
}: {
  tone?: StatusTone;
  /** Kept for API compatibility; colors come from the active MUI palette. */
  theme?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  void _theme;

  return (
    <MuiChip
      data-slot="status-badge"
      size="small"
      variant="soft"
      color={toneToColor[tone]}
      label={children}
      className={className}
    />
  );
}
