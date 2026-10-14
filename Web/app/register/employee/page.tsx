"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Clock, Mail, Smartphone } from "lucide-react";
import NextLink from "next/link";
import { AuthRegisterShell } from "@/components/auth/auth-register-shell";

const steps = [
  {
    icon: Mail,
    title: "Your manager invites you",
    body: "Employers add you to the roster and send a portal invite email—there’s no open employee signup.",
  },
  {
    icon: Smartphone,
    title: "Accept the invite & sign in",
    body: "Use the link in your email to set a password, then sign in anytime at the employee portal.",
  },
  {
    icon: Clock,
    title: "Clock in your way",
    body: "Punch from the portal (when remote punch is enabled) or use the workplace kiosk with your PIN.",
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
              color: "var(--eb-gold-500)",
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
            Access is invite-only
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: "0.9375rem", sm: "1rem" },
              lineHeight: 1.6,
              color: "text.secondary",
            }}
          >
            Your employer creates your profile and sends a portal invite. After
            you accept it, sign in here to view attendance, request leave, and
            clock in when remote punch is allowed.
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
                    borderColor:
                      "color-mix(in srgb, var(--eb-gold-500) 30%, transparent)",
                    bgcolor:
                      "color-mix(in srgb, var(--eb-gold-500) 10%, transparent)",
                    color: "var(--eb-gold-500)",
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
                  borderColor: "var(--eb-gold-500)",
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
              fullWidth
              sx={{
                borderRadius: 999,
                py: 1.5,
                width: { sm: "auto" },
                background: "var(--eb-gold-gradient)",
                color: "var(--eb-navy-950)",
                boxShadow: "0 8px 24px var(--eb-gold-glow)",
                "&:hover": {
                  filter: "brightness(1.06)",
                  background: "var(--eb-gold-gradient)",
                  boxShadow: "0 10px 28px rgba(217, 166, 63, 0.32)",
                },
              }}
            >
              Employee sign in
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
          Have an invite email? Open the link there, or{" "}
          <Link
            component={NextLink}
            href="/login"
            underline="hover"
            sx={{
              fontWeight: 500,
              color: "var(--eb-gold-300)",
              "&:hover": { color: "var(--eb-gold-500)" },
            }}
          >
            sign in
          </Link>
          {" · "}
          Manager setting up a company?{" "}
          <Link
            component={NextLink}
            href="/register/employer"
            underline="hover"
            sx={{
              fontWeight: 500,
              color: "var(--eb-gold-300)",
              "&:hover": { color: "var(--eb-gold-500)" },
            }}
          >
            Register as an employer
          </Link>
        </Typography>
      </Box>
    </AuthRegisterShell>
  );
}
