import { Briefcase, Tablet } from "lucide-react";
import Link from "next/link";
import { AuthRegisterShell } from "@/components/auth/auth-register-shell";
import { RegisterRoleCard } from "@/components/auth/register-role-card";

export default function RegisterPage() {
  return (
    <AuthRegisterShell>
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-[var(--eb-accent)]">
            Get started
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,4.5vw,2.5rem)] font-normal tracking-[-0.03em] text-[var(--eb-text)]">
            How will you use Elitebase?
          </h1>
          <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-[var(--eb-muted)] sm:text-base">
            Employers set up the company, kiosks, and timesheets. Employees clock
            in on the tablet at work—no app signup required.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-2 md:gap-6">
          <RegisterRoleCard
            href="/register/employer"
            title="I'm an employer"
            description="Create your company workspace and invite your team."
            icon={Briefcase}
            featured
            bullets={[
              "Register your business in minutes",
              "Pair kiosks and manage locations",
              "Live attendance and payroll exports",
            ]}
          />
          <RegisterRoleCard
            href="/register/employee"
            title="I'm an employee"
            description="Your manager adds you—you punch in at the kiosk."
            icon={Tablet}
            bullets={[
              "PIN clock-in at your workplace tablet",
              "Optional face verification on site",
              "Schedules and hours from your employer",
            ]}
          />
        </div>

        <p className="mt-10 text-center text-sm text-[var(--eb-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--eb-accent)] transition-colors hover:text-[var(--eb-text)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthRegisterShell>
  );
}
