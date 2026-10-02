"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthCheckbox } from "@/components/auth/auth-checkbox";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useAuthFormAttempts } from "@/lib/auth/form-attempts";
import {
  employerRegisterSchema,
  type EmployerRegisterInput,
} from "@/lib/validations/auth";

type EmployerRegisterFormProps = {
  errorMessage?: string | null;
  action: (formData: FormData) => void | Promise<void>;
};

export function EmployerRegisterForm({
  errorMessage,
  action,
}: EmployerRegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, consumeAttempt } = useAuthFormAttempts(
    "auth-attempts:register-employer"
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerRegisterInput>({
    resolver: zodResolver(employerRegisterSchema),
    defaultValues: {
      companyName: "",
      ownerName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    mode: "onTouched",
  });

  const onSubmit = (data: EmployerRegisterInput) => {
    if (!consumeAttempt()) return;

    const formData = new FormData();
    formData.set("companyName", data.companyName);
    formData.set("ownerName", data.ownerName);
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);
    if (data.termsAccepted) {
      formData.set("termsAccepted", "on");
    }

    startTransition(() => {
      void action(formData);
    });
  };

  const busy = isPending || isSubmitting;
  const submitDisabled = !canSubmit || busy;

  return (
    <Box>
      {lockMessage ? (
        <AuthAlert variant="error">{lockMessage}</AuthAlert>
      ) : null}

      {errorMessage ? (
        <AuthAlert variant="error">{errorMessage}</AuthAlert>
      ) : null}

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        aria-busy={busy}
      >
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AuthField
                id="companyName"
                label="Company name"
                type="text"
                autoComplete="organization"
                aria-required
                error={errors.companyName?.message}
                {...register("companyName")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AuthField
                id="ownerName"
                label="Your name"
                type="text"
                autoComplete="name"
                aria-required
                error={errors.ownerName?.message}
                {...register("ownerName")}
              />
            </Grid>
          </Grid>

          <AuthField
            id="email"
            label="Work email"
            type="email"
            autoComplete="email"
            aria-required
            error={errors.email?.message}
            {...register("email")}
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AuthField
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                aria-required
                hint={
                  errors.password?.message ? undefined : "At least 8 characters"
                }
                error={errors.password?.message}
                {...register("password")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AuthField
                id="confirmPassword"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                aria-required
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </Grid>
          </Grid>

          <Controller
            name="termsAccepted"
            control={control}
            render={({ field: { value, onChange, onBlur, ref, name } }) => (
              <AuthCheckbox
                id="termsAccepted"
                name={name}
                ref={ref}
                checked={value}
                onChange={(event) => onChange(event.target.checked)}
                onBlur={onBlur}
                error={errors.termsAccepted?.message}
              >
                I agree to the{" "}
                <Link
                  component={NextLink}
                  href="/terms-of-service"
                  target="_blank"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  component={NextLink}
                  href="/privacy-policy"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </AuthCheckbox>
            )}
          />

          <Box sx={{ pt: 1 }}>
            <AuthSubmitButton
              idleLabel="Create account"
              pendingLabel="Creating account…"
              disabled={submitDisabled}
            />
          </Box>
        </Stack>
      </Box>

      <Typography
        sx={{
          mt: 3,
          textAlign: "center",
          fontSize: "0.875rem",
          color: "text.secondary",
        }}
      >
        Looking for employee instructions?{" "}
        <Link
          component={NextLink}
          href="/register/employee"
          underline="hover"
          sx={{
            fontWeight: 500,
            color: "primary.main",
            "&:hover": { color: "text.primary" },
          }}
        >
          Go here
        </Link>
      </Typography>
    </Box>
  );
}
