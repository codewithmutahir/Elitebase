"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { LogoDropzone } from "@/components/auth/logo-dropzone";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { TimezoneSelect, type TimezoneOption } from "@/components/auth/timezone-select";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useAuthFormAttempts } from "@/lib/auth/form-attempts";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

type OnboardingFormProps = {
  companyName?: string | null;
  timezoneOptions: TimezoneOption[];
  defaultTimezone: string;
  existingLogoUrl?: string | null;
  action: (formData: FormData) => void | Promise<void>;
};

export function OnboardingForm({
  companyName,
  timezoneOptions,
  defaultTimezone,
  existingLogoUrl,
  action,
}: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const { canSubmit, lockMessage, consumeAttempt } = useAuthFormAttempts(
    "auth-attempts:onboarding"
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      timezone: defaultTimezone as OnboardingInput["timezone"],
      logo: undefined,
    },
    mode: "onTouched",
  });

  const onSubmit = (data: OnboardingInput) => {
    if (!consumeAttempt()) return;

    const formData = new FormData();
    formData.set("timezone", data.timezone);
    if (data.logo && data.logo.size > 0) {
      formData.set("logo", data.logo);
    }

    startTransition(() => {
      void action(formData);
    });
  };

  async function goToBrandStep() {
    const valid = await trigger("timezone");
    if (valid) setStep(2);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isPending || isSubmitting}
    >
      {lockMessage ? (
        <AuthAlert variant="error">{lockMessage}</AuthAlert>
      ) : null}

      <OnboardingWizard
        companyName={companyName}
        step={step}
        onNext={goToBrandStep}
        onBack={() => setStep(1)}
        timezoneStep={
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <TimezoneSelect
                options={timezoneOptions}
                defaultValue={defaultTimezone}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.timezone?.message}
              />
            )}
          />
        }
        logoStep={
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <LogoDropzone
                existingLogoUrl={existingLogoUrl}
                onFileChange={(file) => field.onChange(file)}
                error={errors.logo?.message}
              />
            )}
          />
        }
        submitButton={
          <AuthSubmitButton
            idleLabel="Finish setup"
            pendingLabel="Saving…"
            disabled={!canSubmit || isPending || isSubmitting}
          />
        }
      />
    </form>
  );
}
