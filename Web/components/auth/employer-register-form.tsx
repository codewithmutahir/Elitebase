"use client";

import Link from "next/link";
import { useState, type FormHTMLAttributes, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EmployerRegisterFormProps = FormHTMLAttributes<HTMLFormElement> & {
  errorMessage?: string | null;
  submitButton: ReactNode;
};

export function EmployerRegisterForm({
  errorMessage,
  submitButton,
  className,
  action,
  onSubmit,
  ...props
}: EmployerRegisterFormProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <div>
      {errorMessage ? (
        <p
          className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {localError ? (
        <p
          className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {localError}
        </p>
      ) : null}

      <form
        action={action}
        className={cn("space-y-4", className)}
        onSubmit={(event) => {
          const form = event.currentTarget;
          const password = String(new FormData(form).get("password") ?? "");
          const confirm = String(
            new FormData(form).get("confirmPassword") ?? ""
          );
          if (password !== confirm) {
            event.preventDefault();
            setLocalError("Passwords do not match.");
            return;
          }
          setLocalError(null);
          onSubmit?.(event);
        }}
        {...props}
      >
        <Input
          id="companyName"
          name="companyName"
          label="Company name"
          type="text"
          required
          autoComplete="organization"
        />
        <Input
          id="ownerName"
          name="ownerName"
          label="Your name"
          type="text"
          required
          autoComplete="name"
        />
        <Input
          id="email"
          name="email"
          label="Work email"
          type="email"
          required
          autoComplete="email"
        />
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="At least 8 characters"
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2.5 text-sm text-slate-600">
          <input
            name="termsAccepted"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I agree to the{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Privacy Policy
            </Link>
          </span>
        </label>

        <div className="pt-2">{submitButton}</div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Looking for employee instructions?{" "}
        <Link
          href="/register/employee"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Go here
        </Link>
      </p>
    </div>
  );
}
