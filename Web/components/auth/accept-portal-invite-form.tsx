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
  acceptPortalInviteSchema,
  type AcceptPortalInviteInput,
} from "@/lib/validations/auth";

type AcceptPortalInviteFormProps = {
  token: string;
  action: (formData: FormData) => void | Promise<void>;
  failureSignal?: string | null;
};

const ATTEMPT_KEY = "auth-attempts:accept-portal-invite:v1";

export function AcceptPortalInviteForm({
  token,
  action,
  failureSignal = null,
}: AcceptPortalInviteFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, beginAttempt } = useAuthFormAttempts(
    ATTEMPT_KEY,
    failureSignal
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptPortalInviteInput>({
    resolver: zodResolver(acceptPortalInviteSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const onSubmit = (data: AcceptPortalInviteInput) => {
    if (!beginAttempt()) return;

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
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={!canSubmit || isPending}
          {...register("password")}
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={!canSubmit || isPending}
          {...register("confirmPassword")}
        />

        <AuthSubmitButton
          disabled={!canSubmit || isPending || isSubmitting}
          idleLabel="Activate portal"
          pendingLabel="Activating…"
        />
      </Stack>
    </Box>
  );
}
