import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ForgotPasswordSubmitButton } from "./submit-button";

async function requestReset(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=missing_email");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";

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
    redirect("/forgot-password?error=request_failed");
  }

  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  const errorMessage =
    error === "missing_email"
      ? "Enter your email address."
      : error === "request_failed"
        ? "Could not send reset email. Try again in a moment."
        : error
          ? "Something went wrong. Please try again."
          : null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-6 py-16 text-[#0F172A]">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Reset your password</h1>
        <p className="mt-3 text-[#64748B]">
          Enter your account email and we&apos;ll send a link to choose a new
          password.
        </p>

        {sent === "1" ? (
          <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-[#047857]">
            If an account exists for that email, you&apos;ll receive a reset link
            shortly. Check your inbox and spam folder.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </p>
        ) : null}

        {sent !== "1" ? (
          <form action={requestReset} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-[#CBD5E1] px-4 py-3 outline-none ring-[#2563EB] focus:ring-2"
              />
            </div>

            <ForgotPasswordSubmitButton />
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-[#64748B]">
          <Link href="/login" className="font-semibold text-[#2563EB]">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
