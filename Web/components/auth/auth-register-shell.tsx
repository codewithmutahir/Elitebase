import Link from "next/link";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";
import { LandingButton } from "@/components/landing/landing-button";

export function AuthRegisterShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-shell relative min-h-screen bg-[var(--eb-ink)]">
      <LandingAtmosphere />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Link
          href="/"
          className="text-[1.125rem] font-semibold tracking-tight text-[var(--eb-text)] sm:text-[1.25rem]"
        >
          Elite<span className="text-[var(--eb-accent)]">base</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="hidden text-sm font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)] sm:inline"
          >
            Back to home
          </Link>
          <LandingButton href="/login" variant="ghost" size="nav">
            Sign in
          </LandingButton>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
