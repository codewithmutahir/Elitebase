import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  children: ReactNode;
  tagline?: string;
  features?: readonly string[];
  backHref?: string;
  backLabel?: string;
};

/** One continuous dark canvas — no column seam; copy left, form right. */
export function AuthSplitLayout({
  children,
  tagline,
  features,
  backHref = "/register",
  backLabel = "Change role",
}: AuthSplitLayoutProps) {
  return (
    <div className="landing-shell relative flex min-h-screen flex-col bg-[var(--eb-ink)]">
      <LandingAtmosphere />

      <header className="relative z-10 flex items-center justify-between border-b border-[var(--eb-border)]/40 px-5 py-4 sm:px-8 lg:px-10 lg:py-5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[var(--eb-text)] lg:text-xl"
        >
          Elite<span className="text-[var(--eb-accent)]">base</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <Link
            href={backHref}
            className="text-sm font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
          >
            {backLabel}
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--eb-accent)] transition-colors hover:text-[var(--eb-text)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="relative z-10 grid flex-1 lg:grid-cols-2 lg:items-stretch">
        <AuthBrandPanel tagline={tagline} features={features} />

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-12 xl:px-14">
          {children}
        </div>
      </div>
    </div>
  );
}
