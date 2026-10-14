"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Briefcase, Tablet } from "lucide-react";
import NextLink from "next/link";
import { AuthRegisterShell } from "@/components/auth/auth-register-shell";
import { RegisterRoleCard } from "@/components/auth/register-role-card";

export default function RegisterPage() {
  return (
    <AuthRegisterShell>
      <Box sx={{ mx: "auto", width: "100%", maxWidth: 920 }}>
        <Box sx={{ mx: "auto", maxWidth: 560, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--eb-gold-500)",
            }}
          >
            Get started
          </Typography>
          <Typography
            component="h1"
            sx={{
              mt: 1.5,
              fontSize: "clamp(1.75rem, 4.5vw, 2.5rem)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              color: "var(--eb-text)",
            }}
          >
            How will you use Elitebase?
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: { xs: "0.9375rem", sm: "1rem" },
              lineHeight: 1.6,
              color: "var(--eb-muted)",
              textWrap: "pretty",
            }}
          >
            Employers set up the company, kiosks, and timesheets. Employees join
            by invite—then use the portal or the workplace kiosk.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: { xs: 5, sm: 6 } }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <RegisterRoleCard
              href="/register/employer"
              title="I'm an employer"
              description="Create your company workspace and invite your team."
              icon={Briefcase}
              featured
              bullets={[
                "Register your business in minutes",
                "Pair kiosks and manage locations",
                "Live attendance and payroll exports",
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <RegisterRoleCard
              href="/register/employee"
              title="I'm an employee"
              description="Your manager invites you—then sign in to the portal."
              icon={Tablet}
              bullets={[
                "Accept a portal invite from your employer",
                "Attendance, leave, pay, and remote clock-in",
                "Or punch at the workplace kiosk with your PIN",
              ]}
            />
          </Grid>
        </Grid>

        <Typography
          sx={{
            mt: 5,
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--eb-muted)",
          }}
        >
          Already have an account?{" "}
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
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthRegisterShell>
  );
}
