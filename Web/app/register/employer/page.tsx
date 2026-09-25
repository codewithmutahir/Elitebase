import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { EmployerRegisterForm } from "@/components/auth/employer-register-form";
import { auth } from "@/lib/auth";
import { createCompanyForOwner } from "@/lib/company";
import {
  enforceAuthRateLimitInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseEmployerRegisterFormData } from "@/lib/validations/auth";

async function registerEmployer(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction(
    "register-employer",
    "/register/employer"
  );

  const parsed = parseEmployerRegisterFormData(formData);
  if (!parsed.success) {
    redirect("/register/employer?error=validation");
  }

  const { companyName, ownerName, email, password } = parsed.data;

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
      redirect("/register/employer?error=signup_failed");
    }

    userId = result.user.id;

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
        redirect("/register/employer?error=email_exists");
      }

      if (error.status === 429) {
        redirect("/register/employer?error=rate_limited");
      }

      redirect("/register/employer?error=signup_failed");
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
        redirect("/register/employer?error=db_unreachable");
      }

      redirect("/register/employer?error=signup_failed");
    }
  }

  if (!userId) {
    redirect("/register/employer?error=signup_failed");
  }

  let companyResult: { ok: true } | { error: string };
  try {
    companyResult = await createCompanyForOwner(userId, companyName);
  } catch {
    redirect("/register/employer?error=missing_env");
  }

  if ("error" in companyResult) {
    console.error("Company create failed:", companyResult.error);
    redirect("/register/employer?error=company_create_failed");
  }

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
          <p className="text-center text-sm text-[var(--eb-muted)]">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--eb-accent)] hover:text-[var(--eb-text)]"
            >
              Sign in
            </Link>
          </p>
        }
      >
        <EmployerRegisterForm
          action={registerEmployer}
          errorMessage={errorMessage}
        />
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
