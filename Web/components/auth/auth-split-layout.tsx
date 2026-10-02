"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";

type AuthSplitLayoutProps = {
  children: ReactNode;
  tagline?: string;
  features?: readonly string[];
  backHref?: string;
  backLabel?: string;
};

/** One continuous dark canvas — no column seam; copy left, form right. */
export function AuthSplitLayout({
  children,
  tagline,
  features,
  backHref = "/register",
  backLabel = "Change role",
}: AuthSplitLayoutProps) {
  return (
    <Box
      className="landing-shell"
      sx={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
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
          borderBottom: "1px solid",
          borderColor: "divider",
          px: { xs: 2.5, sm: 4, lg: 5 },
          py: { xs: 2, lg: 2.5 },
        }}
      >
        <Typography
          component={Link}
          href="/"
          sx={{
            fontSize: { xs: "1.125rem", lg: "1.25rem" },
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "text.primary",
            textDecoration: "none",
          }}
        >
          Elite
          <Box component="span" sx={{ color: "primary.main" }}>
            base
          </Box>
        </Typography>
        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 2.5 }}
          sx={{ alignItems: "center" }}
        >
          <Typography
            component={Link}
            href={backHref}
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "text.primary" },
            }}
          >
            {backLabel}
          </Typography>
          <Typography
            component={Link}
            href="/login"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { color: "text.primary" },
            }}
          >
            Sign in
          </Typography>
        </Stack>
      </Box>

      <Grid
        container
        sx={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          alignItems: { lg: "stretch" },
        }}
      >
        <Grid size={{ xs: 12, lg: 6 }}>
          <AuthBrandPanel tagline={tagline} features={features} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 2.5, sm: 4, lg: 5, xl: 7 },
              py: { xs: 5, lg: 6 },
            }}
          >
            {children}
          </Container>
        </Grid>
      </Grid>
    </Box>
  );
}
