"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthField } from "@/components/auth/auth-field";
import { LoginSubmitButton } from "@/app/login/submit-button";
import { useAuthFormAttempts } from "@/lib/auth/form-attempts";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

const ATTEMPT_KEY = "auth-attempts:login";

export function LoginForm({ action }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, consumeAttempt } =
    useAuthFormAttempts(ATTEMPT_KEY);

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
    if (!consumeAttempt()) return;

    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);

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

      <div>
        <div className="mb-2 flex items-center justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[var(--eb-accent)] hover:text-[var(--eb-text)] sm:text-sm"
          >
            Forgot password?
          </Link>
        </div>
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          aria-required
          error={errors.password?.message}
          {...register("password")}
        />
      </div>

      <LoginSubmitButton
        disabled={!canSubmit || isPending || isSubmitting}
      />
    </form>
  );
}
