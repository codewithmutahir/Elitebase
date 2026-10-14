import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFooterText } from "@/components/auth/auth-footer-text";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { auth } from "@/lib/auth";
import {
  authRateLimitErrorCode,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { peekAuthRateLimitForAction } from "@/lib/auth/rate-limit";
import { parseResetPasswordFormData } from "@/lib/validations/auth";

async function failReset(
  error: string,
  token?: string
): Promise<never> {
  await recordAuthRateLimitFailureInAction("reset-password");
  const query = token
    ? `?token=${encodeURIComponent(token)}&error=${error}`
    : `?error=${error}`;
  redirect(`/reset-password${query}`);
}

async function resetPassword(formData: FormData) {
  "use server";

  const tokenHint = String(formData.get("token") ?? "").trim();
  const rateLimit = await peekAuthRateLimitForAction("reset-password");
  if (rateLimit.limited) {
    const errorCode = authRateLimitErrorCode(rateLimit);
    const query = tokenHint
      ? `?token=${encodeURIComponent(tokenHint)}&error=${errorCode}`
      : `?error=${errorCode}`;
    redirect(`/reset-password${query}`);
  }

  const parsed = parseResetPasswordFormData(formData);
  if (!parsed.success) {
    const token = String(formData.get("token") ?? "").trim();
    await failReset("validation", token || undefined);
  }

  const { token, password } = parsed.data;

  try {
    await auth.api.resetPassword({
      body: {
        newPassword: password,
        token,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code ?? "";
      if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") {
        await failReset("invalid_token");
      }
    }

    console.error(
      "Password reset failed:",
      error instanceof Error ? error.message : error
    );
    await failReset("reset_failed", token);
  }

  redirect("/login?reset=success");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "invalid_token"
      ? "This reset link is invalid or has expired. Request a new one."
      : error === "validation" ||
          error === "weak_password" ||
          error === "mismatch"
        ? "Check your new password and confirmation, then try again."
        : error === "reset_failed"
          ? "Could not reset your password. Try again or request a new link."
          : error
            ? "Something went wrong. Please try again."
            : null);

  const failureSignal = error && !rateLimitMessage ? error : null;

  if (!token) {
    return (
      <AuthSplitLayout backHref="/forgot-password" backLabel="Request new link">
        <AuthFormCard title="Reset password">
          <AuthAlert variant="error">
            {errorMessage ??
              "Missing reset token. Use the link from your email or request a new one."}
          </AuthAlert>
          <div style={{ marginTop: 24 }}>
            <AuthFooterText href="/forgot-password" label="Request reset link" />
          </div>
        </AuthFormCard>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout backHref="/login" backLabel="Back to sign in">
      <AuthFormCard
        eyebrow="Account recovery"
        title="Choose a new password"
        subtitle="Enter and confirm your new password below."
        footer={<AuthFooterText href="/login" label="Back to sign in" />}
      >
        {errorMessage ? (
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
        ) : null}

        <ResetPasswordForm
          token={token}
          action={resetPassword}
          failureSignal={failureSignal}
        />
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
