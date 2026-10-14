"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import NextLink from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { LoginSubmitButton } from "@/app/login/submit-button";
import { useAuthFormAttempts } from "@/lib/auth/form-attempts";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  /** Set when the server redirected back with an auth failure (not rate-limit). */
  failureSignal?: string | null;
};

/** v2: only failed attempts count (successes no longer lock the form). */
const ATTEMPT_KEY = "auth-attempts:login:v2";

export function LoginForm({
  action,
  failureSignal = null,
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, beginAttempt } = useAuthFormAttempts(
    ATTEMPT_KEY,
    failureSignal
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = (data: LoginInput) => {
    if (!beginAttempt()) return;

    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);

    startTransition(() => {
      void action(formData);
    });
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isPending || isSubmitting}
    >
      <Stack spacing={2}>
        {lockMessage ? (
          <AuthAlert variant="error">{lockMessage}</AuthAlert>
        ) : null}

        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          aria-required
          error={errors.email?.message}
          {...register("email")}
        />

        <Box>
          <Box
            sx={{
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Link
              component={NextLink}
              href="/forgot-password"
              underline="hover"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 500,
                color: "var(--eb-gold-300)",
                "&:hover": { color: "var(--eb-gold-500)" },
              }}
            >
              Forgot password?
            </Link>
          </Box>
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            aria-required
            error={errors.password?.message}
            {...register("password")}
          />
        </Box>

        <LoginSubmitButton
          disabled={!canSubmit || isPending || isSubmitting}
        />
      </Stack>
    </Box>
  );
}
