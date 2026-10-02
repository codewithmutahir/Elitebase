"use client";

import ArrowForward from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type RegisterRoleCardProps = {
  href: string;
  title: string;
  description: string;
  bullets: readonly string[];
  icon: LucideIcon;
  featured?: boolean;
};

/**
 * Role picker card — always dark ink/teal via `--eb-*` (landing-shell).
 * Avoids MUI cssVariables alpha resolving to light paper on auth routes.
 */
export function RegisterRoleCard({
  href,
  title,
  description,
  bullets,
  icon: Icon,
  featured,
}: RegisterRoleCardProps) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        borderRadius: { xs: "1.25rem", sm: "1.5rem" },
        border: "1px solid",
        borderColor: featured
          ? "rgba(46, 196, 182, 0.35)"
          : "var(--eb-border)",
        bgcolor: featured
          ? "rgba(14, 21, 36, 0.92)"
          : "rgba(14, 21, 36, 0.78)",
        p: { xs: 3, sm: 4 },
        textDecoration: "none",
        backdropFilter: "blur(12px)",
        boxShadow: featured
          ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px rgba(46, 196, 182, 0.1)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        transition:
          "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(46, 196, 182, 0.45)",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(46, 196, 182, 0.12)",
          "& .role-card-continue": {
            color: "var(--eb-text)",
          },
          "& .role-card-arrow": {
            transform: "translateX(2px)",
          },
          "& .role-card-icon": {
            borderColor: "rgba(46, 196, 182, 0.35)",
            bgcolor: "rgba(46, 196, 182, 0.12)",
          },
        },
      }}
    >
      {featured ? (
        <Chip
          label="Most teams start here"
          size="small"
          sx={{
            position: "absolute",
            right: 20,
            top: 20,
            height: 22,
            fontSize: "0.6875rem",
            fontWeight: 600,
            border: "1px solid",
            borderColor: "rgba(46, 196, 182, 0.45)",
            bgcolor: "rgba(46, 196, 182, 0.14)",
            color: "var(--eb-accent)",
          }}
        />
      ) : null}

      <Box
        className="role-card-icon"
        sx={{
          display: "flex",
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
          border: "1px solid",
          borderColor: featured
            ? "rgba(46, 196, 182, 0.3)"
            : "var(--eb-border)",
          bgcolor: "var(--eb-elevated)",
          color: "var(--eb-accent)",
          transition: "border-color 200ms ease, background-color 200ms ease",
        }}
      >
        <Icon size={24} strokeWidth={1.5} aria-hidden />
      </Box>

      <Typography
        component="h2"
        sx={{
          mt: 3,
          fontSize: { xs: "1.25rem", sm: "1.35rem" },
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--eb-text)",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          mt: 1,
          fontSize: { xs: "0.875rem", sm: "0.9375rem" },
          lineHeight: 1.6,
          color: "var(--eb-muted)",
        }}
      >
        {description}
      </Typography>

      <Stack
        component="ul"
        spacing={1.25}
        sx={{
          mt: 2.5,
          borderTop: "1px solid",
          borderColor: "var(--eb-border)",
          pt: 2.5,
          p: 0,
          m: 0,
          listStyle: "none",
        }}
      >
        {bullets.map((item) => (
          <Box
            component="li"
            key={item}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.25,
              fontSize: "0.875rem",
              color: "var(--eb-muted)",
            }}
          >
            <Box
              sx={{
                mt: 0.875,
                width: 6,
                height: 6,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: "var(--eb-accent)",
              }}
              aria-hidden
            />
            {item}
          </Box>
        ))}
      </Stack>

      <Typography
        className="role-card-continue"
        sx={{
          mt: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--eb-accent)",
          transition: "color 200ms ease",
        }}
      >
        Continue
        <ArrowForward
          className="role-card-arrow"
          sx={{
            fontSize: 16,
            transition: "transform 200ms ease",
          }}
          aria-hidden
        />
      </Typography>
    </Box>
  );
}
