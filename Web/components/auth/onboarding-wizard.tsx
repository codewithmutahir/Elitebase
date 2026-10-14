"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { muiAlpha } from "@/lib/mui/alpha";

const STEPS = ["Timezone", "Brand"] as const;

type OnboardingWizardProps = {
  companyName?: string | null;
  step: number;
  onNext: () => void;
  onBack: () => void;
  timezoneStep: ReactNode;
  logoStep: ReactNode;
  submitButton: ReactNode;
};

export function OnboardingWizard({
  companyName,
  step,
  onNext,
  onBack,
  timezoneStep,
  logoStep,
  submitButton,
}: OnboardingWizardProps) {
  const activeStep = Math.max(0, step - 1);

  return (
    <Box>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 4,
          "& .MuiStepLabel-label": {
            mt: 1,
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "text.secondary",
            "&.Mui-active, &.Mui-completed": {
              color: "text.primary",
            },
          },
          "& .MuiStepIcon-root": {
            color: (theme) =>
              muiAlpha(theme, (p) => p.text.secondary, 0.25),
            "&.Mui-active, &.Mui-completed": {
              color: "var(--eb-gold-500)",
            },
          },
          "& .MuiStepIcon-text": {
            fill: "var(--eb-navy-950)",
            fontWeight: 600,
          },
        }}
      >
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {companyName ? (
        <Typography
          sx={{
            mb: 3,
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "text.secondary",
          }}
        >
          Setting up{" "}
          <Box component="span" sx={{ color: "text.primary" }}>
            {companyName}
          </Box>
        </Typography>
      ) : null}

      <Box sx={{ display: step === 1 ? "block" : "none" }}>{timezoneStep}</Box>
      <Box sx={{ display: step === 2 ? "block" : "none" }}>{logoStep}</Box>

      <Divider sx={{ mt: 4, mb: 3, borderColor: "divider" }} />

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {step === 1 ? (
          <>
            <Typography
              component={Link}
              href="/dashboard"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "text.secondary",
                textDecoration: "none",
                "&:hover": { color: "var(--eb-gold-500)" },
              }}
            >
              Skip for now
            </Typography>
            <Button
              type="button"
              variant="contained"
              onClick={onNext}
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1.25,
                fontSize: "0.875rem",
                fontWeight: 500,
                background: "var(--eb-gold-gradient)",
                color: "var(--eb-navy-950)",
                boxShadow: "0 8px 24px var(--eb-gold-glow)",
                "&:hover": {
                  filter: "brightness(1.06)",
                  background: "var(--eb-gold-gradient)",
                },
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="text"
              onClick={onBack}
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "text.secondary",
                "&:hover": { color: "text.primary", bgcolor: "transparent" },
              }}
            >
              Back
            </Button>
            <Stack
              direction="row"
              spacing={1.5}
              useFlexGap
              sx={{
                flexWrap: "wrap",
                minWidth: 0,
                flex: { xs: "1 1 100%", sm: "0 0 auto" },
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Typography
                component={Link}
                href="/dashboard"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": { color: "var(--eb-gold-500)" },
                }}
              >
                Skip
              </Typography>
              <Box
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  minWidth: { sm: "10rem" },
                }}
              >
                {submitButton}
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
