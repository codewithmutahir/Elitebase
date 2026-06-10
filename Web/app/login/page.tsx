import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { LoginSubmitButton } from "./submit-button";

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

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

  const errorMessage =
    error === "invalid_credentials"
      ? "Incorrect email or password. Please try again."
      : error === "missing_fields"
        ? "Enter your email and password."
        : error
          ? "Could not sign you in. Please try again."
          : null;

  return (
    <AuthSplitLayout>
      <AuthFormCard
        title="Welcome back"
        subtitle="Sign in to your company dashboard and manage attendance."
        footer={
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700"
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

        <form action={signIn} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            required
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-900"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <LoginSubmitButton />
        </form>
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
