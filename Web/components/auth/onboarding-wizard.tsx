"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        {[1, 2].map((value) => (
          <div key={value} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition",
                step >= value
                  ? "bg-[var(--eb-accent)] text-[var(--eb-ink)]"
                  : "border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-muted)]"
              )}
            >
              {value}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                step >= value ? "text-[var(--eb-text)]" : "text-[var(--eb-muted)]"
              )}
            >
              {value === 1 ? "Timezone" : "Brand"}
            </span>
            {value === 1 ? (
              <div
                className="h-px w-8 bg-[var(--eb-border)] sm:w-12"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>

      {companyName ? (
        <p className="mb-6 text-center text-sm font-medium text-[var(--eb-muted)]">
          Setting up{" "}
          <span className="text-[var(--eb-text)]">{companyName}</span>
        </p>
      ) : null}

      <div className={step === 1 ? "block" : "hidden"}>{timezoneStep}</div>
      <div className={step === 2 ? "block" : "hidden"}>{logoStep}</div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--eb-border)] pt-6">
        {step === 1 ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-accent)]"
            >
              Skip for now
            </Link>
            <button
              type="button"
              onClick={onNext}
              className="eb-btn group relative rounded-full p-px"
            >
              <span className="eb-btn__content eb-btn__content--accent relative flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white">
                Next
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
            >
              Back
            </button>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:flex-none">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-accent)]"
              >
                Skip
              </Link>
              <div className="w-full min-w-[10rem] sm:w-auto">{submitButton}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
