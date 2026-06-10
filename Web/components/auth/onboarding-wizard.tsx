"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OnboardingWizardProps = {
  companyName?: string | null;
  timezoneStep: ReactNode;
  logoStep: ReactNode;
  submitButton: ReactNode;
};

export function OnboardingWizard({
  companyName,
  timezoneStep,
  logoStep,
  submitButton,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        {[1, 2].map((value) => (
          <div key={value} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition",
                step >= value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {value}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                step >= value ? "text-slate-900" : "text-slate-400"
              )}
            >
              {value === 1 ? "Timezone" : "Brand"}
            </span>
            {value === 1 ? (
              <div className="h-px w-8 bg-slate-200 sm:w-12" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>

      {companyName ? (
        <p className="mb-6 text-center text-sm font-medium text-slate-600">
          Setting up <span className="text-slate-900">{companyName}</span>
        </p>
      ) : null}

      <div className={step === 1 ? "block" : "hidden"}>{timezoneStep}</div>
      <div className={step === 2 ? "block" : "hidden"}>{logoStep}</div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
        {step === 1 ? (
          <>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-500 hover:text-blue-600"
            >
              Skip for now
            </Link>
            <Button type="button" size="lg" onClick={() => setStep(2)}>
              Next
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-slate-500 hover:text-blue-600"
              >
                Skip
              </Link>
              {submitButton}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
