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
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type ResetPasswordFormProps = {
  token: string;
  action: (formData: FormData) => void | Promise<void>;
};

const ATTEMPT_KEY = "auth-attempts:reset-password";

export function ResetPasswordForm({ token, action }: ResetPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, consumeAttempt } =
    useAuthFormAttempts(ATTEMPT_KEY);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (data: ResetPasswordInput) => {
    if (!consumeAttempt()) return;

    const formData = new FormData();
    formData.set("token", data.token);
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);

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

        <input type="hidden" {...register("token")} />

        <AuthField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          aria-required
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          aria-required
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <AuthSubmitButton
          idleLabel="Update password"
          pendingLabel="Updating…"
          disabled={!canSubmit || isPending || isSubmitting}
        />
      </Stack>
    </Box>
  );
}
