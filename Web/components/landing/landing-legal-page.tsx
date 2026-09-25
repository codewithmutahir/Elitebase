import Link from "next/link";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";

export function LandingLegalPage({
  title,
  lastModified,
  documentTitle,
  children,
}: {
  title: string;
  lastModified: string;
  documentTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="landing-shell relative min-h-screen bg-[var(--eb-ink)]">
      <LandingAtmosphere />

      <LandingNavbar />

      <main className="relative">
        <header className="px-5 pb-10 pt-[5.5rem] text-center sm:px-8 sm:pb-14 sm:pt-[6.25rem]">
          <h1 className="text-[clamp(2.125rem,5.5vw,3.25rem)] font-normal tracking-[-0.02em] text-[var(--eb-text)]">
            {title}
          </h1>
          <p className="mt-4 text-[0.9375rem] text-[var(--eb-muted)] sm:text-base">
            Last Modified: {lastModified}
          </p>
        </header>

        <article className="mx-auto max-w-[720px] px-5 pb-16 sm:px-8 sm:pb-20 lg:max-w-[780px]">
          <p className="text-[0.8125rem] font-semibold uppercase leading-relaxed tracking-[0.05em] text-[var(--eb-accent)] sm:text-sm">
            {documentTitle}
          </p>

          <div className="mt-8 space-y-10 sm:mt-10">{children}</div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[0.9375rem] font-semibold leading-snug text-[var(--eb-accent)] sm:text-base">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[0.9375rem] leading-[1.75] text-[var(--eb-text)]/90 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export function LegalInlineLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "underline decoration-[var(--eb-border)] underline-offset-[3px] transition-colors hover:text-[var(--eb-accent)]";

  if (external || href.startsWith("http") || href.startsWith("mailto:")) {
    return (
      <a
        href={href}
        className={className}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
