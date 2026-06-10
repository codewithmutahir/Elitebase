import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { LogoDropzone } from "@/components/auth/logo-dropzone";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { TimezoneSelect } from "@/components/auth/timezone-select";
import { auth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";
import { OnboardingSubmitButton } from "./submit-button";

const LOGO_BUCKET = "company-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function completeOnboarding(formData: FormData) {
  "use server";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = createClient();
  const { data: company, error: fetchError } = await admin
    .from("companies")
    .select("id, timezone, logo_url")
    .eq("owner_uid", session.user.id)
    .maybeSingle();

  if (fetchError || !company) {
    console.error("Onboarding: company lookup failed", fetchError?.message);
    redirect("/onboarding?error=no_company");
  }

  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  const timezone = US_TIMEZONES.some((tz) => tz.value === timezoneRaw)
    ? timezoneRaw
    : company.timezone ?? DEFAULT_TIMEZONE;

  const updates: { timezone: string; logo_url?: string } = {
    timezone,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      redirect("/onboarding?error=logo_too_large");
    }

    if (!ALLOWED_LOGO_TYPES.has(logo.type)) {
      redirect("/onboarding?error=logo_invalid_type");
    }

    const extension = logo.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(extension)
      ? extension === "jpeg"
        ? "jpg"
        : extension
      : "png";
    const objectPath = `${company.id}/logo-${Date.now()}.${safeExt}`;
    const buffer = Buffer.from(await logo.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(objectPath, buffer, {
        contentType: logo.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Onboarding: logo upload failed", uploadError.message);
      redirect("/onboarding?error=logo_upload_failed");
    }

    const { data: publicUrl } = admin.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(objectPath);

    updates.logo_url = publicUrl.publicUrl;
  }

  const { error: updateError } = await admin
    .from("companies")
    .update(updates)
    .eq("id", company.id);

  if (updateError) {
    console.error("Onboarding: company update failed", updateError.message);
    redirect("/onboarding?error=save_failed");
  }

  redirect("/dashboard");
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

  const errorMessage =
    error === "no_company"
      ? "We could not find your company record. Please complete employer registration first."
      : error === "logo_too_large"
        ? "Logo must be 2 MB or smaller."
        : error === "logo_invalid_type"
          ? "Logo must be JPEG, PNG, WebP, or GIF."
          : error === "logo_upload_failed"
            ? "Logo upload failed. Ensure the company-logos storage bucket exists in Supabase, then try again."
            : error === "save_failed"
              ? "Could not save your settings. Please try again."
              : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/40 px-6 py-12">
      <section className="w-full max-w-lg rounded-xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Welcome to Elitebase
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Let&apos;s personalize your workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A quick timezone and logo help your dashboard and kiosk feel like
            your brand. You can change these anytime in settings.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-6">
            <AuthAlert variant="error">{errorMessage}</AuthAlert>
          </div>
        ) : null}

        <form
          action={completeOnboarding}
          encType="multipart/form-data"
          className="mt-8"
        >
          <OnboardingWizard
            companyName={company?.name}
            timezoneStep={
              <TimezoneSelect
                options={timezoneOptions}
                defaultValue={selectedTimezone}
              />
            }
            logoStep={
              <LogoDropzone existingLogoUrl={company?.logo_url} />
            }
            submitButton={<OnboardingSubmitButton />}
          />
        </form>
      </section>
    </main>
  );
}
