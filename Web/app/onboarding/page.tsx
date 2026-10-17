import { headers } from "next/headers";

import { redirect } from "next/navigation";

import { AuthAlert } from "@/components/auth/auth-alert";

import { AuthFormCard } from "@/components/auth/auth-form-card";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

import { OnboardingForm } from "@/components/auth/onboarding-form";

import { auth } from "@/lib/auth";

import { createClient } from "@/lib/supabase/server";

import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";

import {
  enforceAuthRateLimitInAction,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseOnboardingFormData } from "@/lib/validations/onboarding";

const LOGO_BUCKET = "company-logos";

async function failOnboarding(error: string): Promise<never> {
  await recordAuthRateLimitFailureInAction("onboarding");
  redirect(`/onboarding?error=${error}`);
}

async function completeOnboarding(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction("onboarding", "/onboarding");

  const session = await auth.api.getSession({

    headers: await headers(),

  });



  if (!session?.user?.id) {

    redirect("/login");

  }



  const parsed = parseOnboardingFormData(formData);

  // failOnboarding never returns, but TS does not narrow across await-never.
  if (!parsed.success) {
    await failOnboarding("validation");
  }
  const { timezone, logo } = parsed.data!;

  const admin = createClient();

  const { data: company, error: fetchError } = await admin
    .from("companies")
    .select("id, timezone, logo_url")
    .eq("owner_uid", session.user.id)
    .maybeSingle();

  if (fetchError || !company) {
    console.error("Onboarding: company lookup failed", fetchError?.message);
    await failOnboarding("no_company");
  }
  const companyRow = company!;

  const updates: { timezone: string; logo_url?: string } = {
    timezone,
  };



  if (logo) {

    const extension = logo.name.split(".").pop()?.toLowerCase() || "png";

    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(extension)

      ? extension === "jpeg"

        ? "jpg"

        : extension

      : "png";

    const objectPath = `${companyRow.id}/logo-${Date.now()}.${safeExt}`;

    const buffer = Buffer.from(await logo.arrayBuffer());



    const { error: uploadError } = await admin.storage

      .from(LOGO_BUCKET)

      .upload(objectPath, buffer, {

        contentType: logo.type,

        upsert: true,

      });



    if (uploadError) {

      console.error("Onboarding: logo upload failed", uploadError.message);

      await failOnboarding("logo_upload_failed");

    }



    const { data: publicUrl } = admin.storage

      .from(LOGO_BUCKET)

      .getPublicUrl(objectPath);



    updates.logo_url = publicUrl.publicUrl;

  }



  const { error: updateError } = await admin

    .from("companies")

    .update(updates)

    .eq("id", companyRow.id);



  if (updateError) {

    console.error("Onboarding: company update failed", updateError.message);

    await failOnboarding("save_failed");

  }

  const { captureServerEvent } = await import(
    "@/lib/analytics/posthog-server"
  );
  const { AnalyticsEvent } = await import("@/lib/analytics/events");
  await captureServerEvent(session.user.id, AnalyticsEvent.onboardingCompleted, {
    companyId: companyRow.id,
  });

  redirect("/dashboard");

}



export default async function OnboardingPage({

  searchParams,

}: {

  searchParams: Promise<{ error?: string }>;

}) {

  const [{ error }, session] = await Promise.all([

    searchParams,

    auth.api.getSession({

      headers: await headers(),

    }),

  ]);



  if (!session?.user) {

    redirect("/login");

  }



  const admin = createClient();

  const { data: company } = await admin

    .from("companies")

    .select("id, name, timezone, logo_url")

    .eq("owner_uid", session.user.id)

    .maybeSingle();



  const selectedTimezone = company?.timezone ?? DEFAULT_TIMEZONE;

  const timezoneOptions = US_TIMEZONES.map((tz) => ({

    value: tz.value,

    label: tz.label,

  }));



  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "no_company"
      ? "We could not find your company record. Please complete employer registration first."
      : error === "validation" ||
          error === "logo_too_large" ||
          error === "logo_invalid_type"
        ? "Check your timezone and logo (max 2 MB, JPEG/PNG/WebP/GIF), then try again."
        : error === "logo_upload_failed"
          ? "Logo upload failed. Ensure the company-logos storage bucket exists in Supabase, then try again."
          : error === "save_failed"
            ? "Could not save your settings. Please try again."
            : null);

  const failureSignal = error && !rateLimitMessage ? error : null;



  return (

    <AuthSplitLayout

      backHref="/dashboard"

      backLabel="Skip setup"

      tagline="Almost there — tune timezone and brand so kiosk and dashboard match how you run the floor."

      features={[

        "US timezones for schedules and punch timestamps",

        "Optional logo on kiosk and employer dashboard",

        "Change anytime in settings",

      ]}

    >

      <AuthFormCard

        eyebrow="Welcome to Elitebase"

        title="Personalize your workspace"

        subtitle="A quick timezone and logo help your dashboard and kiosk feel like your brand."

      >

        {errorMessage ? (

          <AuthAlert variant="error">{errorMessage}</AuthAlert>

        ) : null}



        <OnboardingForm

          companyName={company?.name}

          timezoneOptions={timezoneOptions}

          defaultTimezone={selectedTimezone}

          existingLogoUrl={company?.logo_url}

          failureSignal={failureSignal}

          action={completeOnboarding}

        />

      </AuthFormCard>

    </AuthSplitLayout>

  );

}

