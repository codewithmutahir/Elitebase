"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
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
    <div>
      {lockMessage ? (
        <p
          className="mb-6 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {lockMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          className="mb-6 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-busy={busy}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            id="companyName"
            label="Company name"
            type="text"
            autoComplete="organization"
            aria-required
            error={errors.companyName?.message}
            {...register("companyName")}
          />
          <AuthField
            id="ownerName"
            label="Your name"
            type="text"
            autoComplete="name"
            aria-required
            error={errors.ownerName?.message}
            {...register("ownerName")}
          />
        </div>

        <AuthField
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          aria-required
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            aria-required
            hint={errors.password?.message ? undefined : "At least 8 characters"}
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
        </div>

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
              <Link href="/terms-of-service" target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" target="_blank">
                Privacy Policy
              </Link>
              .
            </AuthCheckbox>
          )}
        />

        <div className="pt-2">
          <AuthSubmitButton
            idleLabel="Create account"
            pendingLabel="Creating account…"
            disabled={submitDisabled}
          />
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--eb-muted)]">
        Looking for employee instructions?{" "}
        <Link
          href="/register/employee"
          className="font-medium text-[var(--eb-accent)] hover:text-[var(--eb-text)]"
        >
          Go here
        </Link>
      </p>
    </div>
  );
}
