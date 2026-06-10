import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { ResetPasswordSubmitButton } from "./submit-button";

async function resetPassword(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    redirect("/reset-password?error=invalid_token");
  }

  if (!password || password.length < 8) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=weak_password`);
  }

  if (password !== confirm) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=mismatch`);
  }

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
        redirect("/reset-password?error=invalid_token");
      }
    }

    console.error(
      "Password reset failed:",
      error instanceof Error ? error.message : error
    );
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=reset_failed`);
  }

  redirect("/login?reset=success");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  const errorMessage =
    error === "invalid_token"
      ? "This reset link is invalid or has expired. Request a new one."
      : error === "weak_password"
        ? "Password must be at least 8 characters."
        : error === "mismatch"
          ? "Passwords do not match."
          : error === "reset_failed"
            ? "Could not reset your password. Try again or request a new link."
            : error
              ? "Something went wrong. Please try again."
              : null;

  if (!token) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-6 py-16 text-[#0F172A]">
        <section className="mx-auto w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Reset password</h1>
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage ??
              "Missing reset token. Use the link from your email or request a new one."}
          </p>
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="font-semibold text-[#2563EB]">
              Request reset link
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-16 text-[#0F172A]">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Choose a new password</h1>
        <p className="mt-3 text-[#64748B]">
          Enter and confirm your new password below.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}

        <form action={resetPassword} className="mt-8 space-y-5">
          <input type="hidden" name="token" value={token} />

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 outline-none ring-[#2563EB] focus:ring-2"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 outline-none ring-[#2563EB] focus:ring-2"
            />
          </div>

          <ResetPasswordSubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          <Link href="/login" className="font-semibold text-[#2563EB]">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
