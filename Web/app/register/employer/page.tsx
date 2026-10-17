import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthFooterText } from "@/components/auth/auth-footer-text";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { EmployerRegisterForm } from "@/components/auth/employer-register-form";
import { auth } from "@/lib/auth";
import { createCompanyForOwner } from "@/lib/company";
import {
  enforceAuthRateLimitInAction,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseEmployerRegisterFormData } from "@/lib/validations/auth";

async function failRegister(error: string): Promise<never> {
  await recordAuthRateLimitFailureInAction("register-employer");
  redirect(`/register/employer?error=${error}`);
}

async function registerEmployer(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction(
    "register-employer",
    "/register/employer"
  );

  const parsed = parseEmployerRegisterFormData(formData);
  if (!parsed.success) {
    await failRegister("validation");
  }
  const { companyName, ownerName, email, password } = parsed.data!;

  const requestHeaders = await headers();
  let userId: string | null = null;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: ownerName,
        email,
        password,
        callbackURL: "/onboarding",
      },
      headers: requestHeaders,
    });

    if (!result?.user?.id) {
      console.error("Employer signup failed: no user returned from Better Auth");
      await failRegister("signup_failed");
    }

    userId = result.user!.id;

    if (!result.token) {
      try {
        await auth.api.signInEmail({
          body: { email, password },
          headers: requestHeaders,
        });
      } catch (signInError) {
        console.error(
          "Sign-in after signup:",
          signInError instanceof Error ? signInError.message : signInError
        );
      }
    }
  } catch (error) {
    if (userId) {
      // Signup succeeded; do not discard company setup below.
    } else if (error instanceof APIError) {
      console.error("Employer signup failed:", {
        message: error.message,
        status: error.status,
      });

      const message = error.message.toLowerCase();

      if (message.includes("already") || message.includes("exists")) {
        await failRegister("email_exists");
      }

      if (error.status === 429) {
        redirect("/register/employer?error=rate_limited");
      }

      await failRegister("signup_failed");
    } else {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error("Employer signup failed:", message);

      if (
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("terminated") ||
        message.toLowerCase().includes("enotfound") ||
        message.toLowerCase().includes("getaddrinfo")
      ) {
        await failRegister("db_unreachable");
      }

      await failRegister("signup_failed");
    }
  }

  if (!userId) {
    await failRegister("signup_failed");
  }

  let companyResult: { ok: true } | { error: string } | undefined;
  try {
    companyResult = await createCompanyForOwner(userId!, companyName);
  } catch {
    await failRegister("missing_env");
  }

  if (!companyResult || "error" in companyResult) {
    console.error(
      "Company create failed:",
      companyResult && "error" in companyResult ? companyResult.error : "unknown"
    );
    await failRegister("company_create_failed");
  }

  const { captureServerEvent } = await import(
    "@/lib/analytics/posthog-server"
  );
  const { AnalyticsEvent } = await import("@/lib/analytics/events");
  await captureServerEvent(userId!, AnalyticsEvent.employerSignedUp);

  redirect("/onboarding");
}

export default async function EmployerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "validation"
      ? "Check the form for errors and try again."
      : error === "email_exists"
        ? "This email is already registered. Please sign in or use a different email."
        : error === "company_create_failed"
          ? "Account created but company setup failed. Sign in and try again, or contact support if this persists."
          : error === "db_unreachable"
            ? "Your network blocks Supabase Postgres (ports 5432/6543). Add BETTER_AUTH_USE_SQLITE=true to .env.local, restart npm run dev, then try again. Or use mobile hotspot / VPN for remote Postgres."
            : error
              ? "Signup failed. Check the terminal for details, then try again."
              : null);

  const failureSignal = error && !rateLimitMessage ? error : null;

  return (
    <AuthSplitLayout
      tagline="Create your company workspace in minutes—employees, kiosks, and timesheets in one place."
      features={[
        "Unlimited employee profiles on every plan",
        "Tablet kiosk setup with one-time codes",
        "Biometric-ready with employer compliance tools",
      ]}
    >
      <AuthFormCard
        eyebrow="Employer registration"
        title="Create your company"
        subtitle="Tell us about your business to get started with Elitebase."
        footer={
          <AuthFooterText
            prompt="Already registered?"
            href="/login"
            label="Sign in"
          />
        }
      >
        <EmployerRegisterForm
          action={registerEmployer}
          errorMessage={errorMessage}
          failureSignal={failureSignal}
        />
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
