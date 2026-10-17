"use client";

import LinearProgress from "@mui/material/LinearProgress";
import { useNavigationPending } from "@/components/navigation/use-navigation-pending";

type HeaderNavProgressProps = {
  /** Extra pending signal (e.g. portal useTransition) so the bar stays up for the whole nav. */
  force?: boolean;
};

/**
 * AppBar-attached progress so desktop sticky headers never cover the route loader.
 */
export function HeaderNavProgress({ force = false }: HeaderNavProgressProps) {
  const storePending = useNavigationPending();
  const pending = force || storePending;

  if (!pending) return null;

  return (
    <LinearProgress
      aria-hidden
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        zIndex: 2,
        height: 3,
        borderRadius: 0,
        bgcolor: "rgba(217,166,63,0.2)",
        ".dashboard-shell--dark &": {
          bgcolor: "rgba(217,166,63,0.12)",
        },
        "& .MuiLinearProgress-bar": {
          bgcolor: "primary.main",
        },
      }}
    />
  );
}
