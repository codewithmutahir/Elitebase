"use client";

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
};

const ATTEMPT_KEY = "auth-attempts:forgot-password";

export function ForgotPasswordForm({ action }: ForgotPasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, consumeAttempt } =
    useAuthFormAttempts(ATTEMPT_KEY);

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
    if (!consumeAttempt()) return;

    const formData = new FormData();
    formData.set("email", data.email);

    startTransition(() => {
      void action(formData);
    });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      aria-busy={isPending || isSubmitting}
    >
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
    </form>
  );
}
