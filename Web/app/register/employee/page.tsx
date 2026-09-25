import Link from "next/link";
import { Clock, ScanFace, Tablet } from "lucide-react";
import { AuthRegisterShell } from "@/components/auth/auth-register-shell";
import { LandingButton } from "@/components/landing/landing-button";

const steps = [
  {
    icon: Tablet,
    title: "Your manager adds you",
    body: "Employers create your profile and assign a kiosk PIN from their dashboard.",
  },
  {
    icon: Clock,
    title: "Clock in at the door",
    body: "Use the workplace tablet—enter your PIN to start and end shifts.",
  },
  {
    icon: ScanFace,
    title: "Face check (if enabled)",
    body: "Some locations use optional face verification to reduce buddy punching.",
  },
] as const;

export default function EmployeeRegisterInfoPage() {
  return (
    <AuthRegisterShell>
      <div className="mx-auto w-full max-w-160">
        <div className="overflow-hidden rounded-[1.5rem] border border-(--eb-border) bg-(--eb-surface)/60 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-10">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-[var(--eb-accent)]">
            For employees
          </p>
          <h1 className="mt-3 text-[clamp(1.5rem,4vw,2rem)] font-normal tracking-[-0.02em] text-[var(--eb-text)]">
            You don&apos;t register here
          </h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--eb-muted)] sm:text-base">
            Elitebase accounts for are created by your employer. Once
            you&apos;re on the roster, use the kiosk at your job site to clock in
            and out.
          </p>

          <ul className="mt-8 space-y-5">
            {steps.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-accent)]">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[var(--eb-text)]">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--eb-muted)]">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LandingButton href="/register" variant="ghost" size="hero" className="w-full sm:w-auto">
              Choose another path
            </LandingButton>
            <LandingButton href="/login" variant="accent" size="hero" className="w-full sm:w-auto">
              Employer sign in
            </LandingButton>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--eb-muted)]">
          Manager setting up a new company?{" "}
          <Link
            href="/register/employer"
            className="font-medium text-[var(--eb-accent)] hover:text-[var(--eb-text)]"
          >
            Register as an employer
          </Link>
        </p>
      </div>
    </AuthRegisterShell>
  );
}
