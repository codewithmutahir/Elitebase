"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const defaultFeatures = [
  "Kiosk PIN clock-in at every location",
  "Optional face verification on tablets",
  "Live dashboard and exportable timesheets",
] as const;

type AuthBrandPanelProps = {
  tagline?: string;
  features?: readonly string[];
  className?: string;
};

export function AuthBrandPanel({
  tagline = "Time tracking and kiosk clock-in built for growing teams.",
  features = defaultFeatures,
  className,
}: AuthBrandPanelProps) {
  return (
    <Box
      component="aside"
      className={className}
      sx={{
        position: "relative",
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        px: { lg: 4, xl: 7 },
        py: { lg: 6, xl: 8 },
      }}
    >
      <Typography
        sx={{
          maxWidth: 448,
          fontSize: "clamp(1.35rem, 2.2vw, 1.75rem)",
          fontWeight: 400,
          lineHeight: 1.35,
          letterSpacing: "-0.02em",
          color: "var(--eb-text)",
        }}
      >
        {tagline}
      </Typography>

      <Stack
        component="ul"
        spacing={2}
        sx={{ mt: 5, maxWidth: 448, p: 0, m: 0, listStyle: "none" }}
      >
        {features.map((feature) => (
          <Box
            component="li"
            key={feature}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                mt: 0.25,
                display: "flex",
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "1px solid",
                borderColor: "color-mix(in srgb, var(--eb-gold-500) 35%, transparent)",
                bgcolor: "color-mix(in srgb, var(--eb-gold-500) 10%, transparent)",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "var(--eb-gold-500)",
              }}
            >
              ✓
            </Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--eb-muted)",
              }}
            >
              {feature}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Typography
        component={Link}
        href="/register"
        sx={{
          mt: 6,
          display: "inline-flex",
          width: "fit-content",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--eb-gold-300)",
          textDecoration: "none",
          "&:hover": { color: "var(--eb-gold-500)" },
        }}
      >
        ← Back to role selection
      </Typography>
    </Box>
  );
}
