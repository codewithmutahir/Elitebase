"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useAuthFormAttempts } from "@/lib/auth/form-attempts";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

type ForgotPasswordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  failureSignal?: string | null;
};

const ATTEMPT_KEY = "auth-attempts:forgot-password:v2";

export function ForgotPasswordForm({
  action,
  failureSignal = null,
}: ForgotPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, beginAttempt } = useAuthFormAttempts(
    ATTEMPT_KEY,
    failureSignal
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    if (!beginAttempt()) return;

    const formData = new FormData();
    formData.set("email", data.email);

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

        <AuthSubmitButton
          idleLabel="Send reset link"
          pendingLabel="Sending…"
          disabled={!canSubmit || isPending || isSubmitting}
        />
      </Stack>
    </Box>
  );
}
