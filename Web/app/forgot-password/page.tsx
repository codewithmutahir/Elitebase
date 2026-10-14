import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFooterText } from "@/components/auth/auth-footer-text";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { auth } from "@/lib/auth";
import {
  enforceAuthRateLimitInAction,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseForgotPasswordFormData } from "@/lib/validations/auth";

async function requestReset(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction("forgot-password", "/forgot-password");

  const parsed = parseForgotPasswordFormData(formData);
  if (!parsed.success) {
    await recordAuthRateLimitFailureInAction("forgot-password");
    redirect("/forgot-password?error=validation");
  }

  const { email } = parsed.data;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${appUrl}/reset-password`,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error(
      "Password reset request failed:",
      error instanceof Error ? error.message : error
    );
    await recordAuthRateLimitFailureInAction("forgot-password");
    redirect("/forgot-password?error=request_failed");
  }

  // Count successful sends too — prevents email-spam abuse.
  await recordAuthRateLimitFailureInAction("forgot-password");
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "validation" || error === "missing_email"
      ? "Enter a valid email address."
      : error === "request_failed"
        ? "Could not send reset email. Try again in a moment."
        : error
          ? "Something went wrong. Please try again."
          : null);

  const failureSignal = error && !rateLimitMessage ? error : null;

  return (
    <AuthSplitLayout backHref="/login" backLabel="Back to sign in">
      <AuthFormCard
        eyebrow="Account recovery"
        title="Reset your password"
        subtitle="Enter your work email and we'll send a link to choose a new password."
        footer={
          <AuthFooterText
            prompt="Remember your password?"
            href="/login"
            label="Sign in"
          />
        }
      >
        {sent === "1" ? (
          <AuthAlert variant="success">
            If an account exists for that email, you&apos;ll receive a reset link
            shortly. Check your inbox and spam folder.
          </AuthAlert>
        ) : null}

        {errorMessage ? (
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
        ) : null}

        {sent !== "1" ? (
          <ForgotPasswordForm
            action={requestReset}
            failureSignal={failureSignal}
          />
        ) : null}
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
