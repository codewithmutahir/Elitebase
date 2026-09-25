import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import {
  enforceAuthRateLimitInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { parseLoginFormData } from "@/lib/validations/auth";

async function signIn(formData: FormData) {
  "use server";

  await enforceAuthRateLimitInAction("login", "/login");

  const parsed = parseLoginFormData(formData);
  if (!parsed.success) {
    redirect("/login?error=validation");
  }

  const { email, password } = parsed.data;

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        callbackURL: "/dashboard",
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code ?? "";
      if (
        code === "INVALID_EMAIL_OR_PASSWORD" ||
        error.status === 401 ||
        error.status === 403
      ) {
        redirect("/login?error=invalid_credentials");
      }
    }

    console.error(
      "Sign in failed:",
      error instanceof Error ? error.message : error
    );
    redirect("/login?error=signin_failed");
  }

  redirect("/dashboard");
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
        : error
          ? "Could not sign you in. Please try again."
          : null);

  return (
    <AuthSplitLayout>
      <AuthFormCard
        eyebrow="Employer sign in"
        title="Welcome back"
        subtitle="Sign in to your company dashboard and manage attendance."
        footer={
          <p className="text-center text-sm text-[var(--eb-muted)]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[var(--eb-accent)] hover:text-[var(--eb-text)]"
            >
              Get started
            </Link>
          </p>
        }
      >
        {successMessage ? (
          <AuthAlert variant="success">{successMessage}</AuthAlert>
        ) : null}
        {errorMessage ? (
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
        ) : null}

        <LoginForm action={signIn} />
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
