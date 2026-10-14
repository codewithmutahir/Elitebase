"use client";

import type { ReactNode } from "react";
import { ElitebaseLogo } from "@/components/brand/elitebase-logo";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type AuthFormCardProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Orchid-style form panel — inset on shared dark canvas (not a floating light card). */
export function AuthFormCard({
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  className,
}: AuthFormCardProps) {
  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        width: "100%",
        maxWidth: 520,
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "var(--eb-border)",
        bgcolor: "color-mix(in srgb, var(--eb-navy-800) 88%, transparent)",
        p: { xs: 3.5, sm: 4.5 },
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
        backgroundImage: "none",
      }}
    >
      <Box sx={{ mb: { xs: 3.5, sm: 4 } }}>
        <Box sx={{ mb: 2.5, lineHeight: 0 }}>
          <ElitebaseLogo />
        </Box>
        {eyebrow ? (
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--eb-gold-500)",
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          component="h1"
          sx={{
            mt: eyebrow ? 1 : 0,
            fontSize: { xs: "1.625rem", sm: "1.75rem" },
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--eb-text)",
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            sx={{
              mt: 1,
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "var(--eb-muted)",
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {children}
      {footer ? (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3, borderColor: "var(--eb-border)" }} />
          {footer}
        </Box>
      ) : null}
    </Paper>
  );
}
