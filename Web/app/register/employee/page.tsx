"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Clock, ScanFace, Tablet } from "lucide-react";
import NextLink from "next/link";
import { AuthRegisterShell } from "@/components/auth/auth-register-shell";

const steps = [
  {
    icon: Tablet,
    title: "Your manager adds you",
    body: "Employers create your profile and assign a kiosk PIN from their dashboard.",
  },
  {
    icon: Clock,
    title: "Clock in at the door",
    body: "Use the workplace tablet—enter your PIN to start and end shifts.",
  },
  {
    icon: ScanFace,
    title: "Face check (if enabled)",
    body: "Some locations use optional face verification to reduce buddy punching.",
  },
] as const;

export default function EmployeeRegisterInfoPage() {
  return (
    <AuthRegisterShell>
      <Box sx={{ mx: "auto", width: "100%", maxWidth: 640 }}>
        <Box
          sx={{
            overflow: "hidden",
            borderRadius: "1.5rem",
            border: "1px solid",
            borderColor: "var(--eb-border)",
            bgcolor: "rgba(14, 21, 36, 0.85)",
            p: { xs: 4, sm: 5 },
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "primary.main",
            }}
          >
            For employees
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            You don&apos;t register here
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: "0.9375rem", sm: "1rem" },
              lineHeight: 1.6,
              color: "text.secondary",
            }}
          >
            Elitebase accounts for are created by your employer. Once
            you&apos;re on the roster, use the kiosk at your job site to clock in
            and out.
          </Typography>

          <Stack component="ul" spacing={2.5} sx={{ mt: 4, p: 0, m: 0, listStyle: "none" }}>
            {steps.map(({ icon: Icon, title, body }) => (
              <Box
                component="li"
                key={title}
                sx={{ display: "flex", gap: 2 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "secondary.main",
                    color: "primary.main",
                  }}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                </Box>
                <Box>
                  <Typography
                    sx={{ fontWeight: 500, color: "text.primary" }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                      color: "text.secondary",
                    }}
                  >
                    {body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mt: 5, alignItems: { sm: "center" } }}
          >
            <Button
              component={NextLink}
              href="/register"
              variant="outlined"
              fullWidth
              sx={{
                borderRadius: 999,
                py: 1.5,
                borderColor: "divider",
                color: "text.primary",
                width: { sm: "auto" },
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "transparent",
                },
              }}
            >
              Choose another path
            </Button>
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                borderRadius: 999,
                py: 1.5,
                color: "primary.contrastText",
                width: { sm: "auto" },
              }}
            >
              Employer sign in
            </Button>
          </Stack>
        </Box>

        <Typography
          sx={{
            mt: 4,
            textAlign: "center",
            fontSize: "0.875rem",
            color: "text.secondary",
          }}
        >
          Manager setting up a new company?{" "}
          <Link
            component={NextLink}
            href="/register/employer"
            underline="hover"
            sx={{
              fontWeight: 500,
              color: "primary.main",
              "&:hover": { color: "text.primary" },
            }}
          >
            Register as an employer
          </Link>
        </Typography>
      </Box>
    </AuthRegisterShell>
  );
}
