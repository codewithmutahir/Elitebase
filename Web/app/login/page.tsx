import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFooterText } from "@/components/auth/auth-footer-text";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import {
  enforceAuthRateLimitInAction,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseLoginFormData } from "@/lib/validations/auth";

async function failLogin(error: string): Promise<never> {
  await recordAuthRateLimitFailureInAction("login");
  redirect(`/login?error=${error}`);
}

async function signIn(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction("login", "/login");

  const parsed = parseLoginFormData(formData);
  if (!parsed.success) {
    await failLogin("validation");
    return;
  }

  const { email, password } = parsed.data;
  let userId: string | null = null;

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });
    userId = result.user?.id ?? null;
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code ?? "";
      if (
        code === "INVALID_EMAIL_OR_PASSWORD" ||
        error.status === 401 ||
        error.status === 403
      ) {
        await failLogin("invalid_credentials");
        return;
      }
    }

    console.error(
      "Sign in failed:",
      error instanceof Error ? error.message : error
    );
    await failLogin("signin_failed");
    return;
  }

  if (!userId) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userId = session?.user?.id ?? null;
  }

  if (!userId) {
    await failLogin("signin_failed");
    return;
  }

  const { resolvePostLoginPath } = await import(
    "@/lib/portal/resolve-post-login"
  );
  redirect(await resolvePostLoginPath(userId));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  const successMessage =
    reset === "success"
      ? "Your password was reset. Sign in with your new password."
      : null;

  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "invalid_credentials"
      ? "Incorrect email or password. Please try again."
      : error === "validation" || error === "missing_fields"
        ? "Enter a valid email and password."
        : error === "not_employee"
          ? "This account is not linked to an employee portal. Use your invite link or contact your manager."
          : error === "deactivated"
            ? "Your employee account is deactivated. Contact your manager."
            : error === "company_suspended"
              ? "This company account has been suspended. Contact Elitebase support."
              : error
                ? "Could not sign you in. Please try again."
                : null);

  const failureSignal =
    error && !rateLimitMessage
      ? error
      : null;

  return (
    <AuthSplitLayout>
      <AuthFormCard
        eyebrow="Sign in"
        title="Welcome back"
        subtitle="Employers open the company dashboard. Employees open the portal after an invite."
        footer={
          <AuthFooterText
            prompt="Don't have an account?"
            href="/register"
            label="Get started"
          />
        }
      >
        {successMessage ? (
          <AuthAlert variant="success">{successMessage}</AuthAlert>
        ) : null}
        {errorMessage ? (
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
        ) : null}

        <LoginForm action={signIn} failureSignal={failureSignal} />
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
