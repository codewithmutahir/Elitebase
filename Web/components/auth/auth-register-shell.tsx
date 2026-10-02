"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";

export function AuthRegisterShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Box
      className="landing-shell"
      sx={{
        position: "relative",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <LandingAtmosphere />

      <Box
        component="header"
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, sm: 4 },
          py: { xs: 2.5, sm: 3 },
        }}
      >
        <Typography
          component={Link}
          href="/"
          sx={{
            fontSize: { xs: "1.125rem", sm: "1.25rem" },
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--eb-text)",
            textDecoration: "none",
          }}
        >
          Elite
          <Box component="span" sx={{ color: "var(--eb-accent)" }}>
            base
          </Box>
        </Typography>
        <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} sx={{ alignItems: "center" }}>
          <Typography
            component={Link}
            href="/"
            sx={{
              display: { xs: "none", sm: "inline" },
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--eb-muted)",
              textDecoration: "none",
              "&:hover": { color: "var(--eb-text)" },
            }}
          >
            Back to home
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 999,
              px: 2,
              borderColor: "var(--eb-border)",
              color: "var(--eb-text)",
              "&:hover": {
                borderColor: "var(--eb-accent)",
                bgcolor: "transparent",
                color: "var(--eb-text)",
              },
            }}
          >
            Sign in
          </Button>
        </Stack>
      </Box>

      <Box
        component="main"
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          px: { xs: 2.5, sm: 4 },
          pb: { xs: 8, sm: 10 },
          pt: { xs: 2, sm: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
