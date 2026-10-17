import Link from "next/link";
import type { SVGProps } from "react";
import { CookieSettingsButton } from "@/components/analytics/cookie-settings-button";
import { ElitebaseLogo } from "@/components/brand/elitebase-logo";

type SocialIconName = "linkedin" | "facebook" | "x" | "youtube" | "rss";

function SocialIcon({
  name,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { name: SocialIconName }) {
  const cn = className ?? "size-6";
  switch (name) {
    case "linkedin":
      return (
        <svg
          className={cn}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          {...props}
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          className={cn}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          {...props}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "x":
      return (
        <svg
          className={cn}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          {...props}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          className={cn}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          {...props}
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "rss":
      return (
        <svg
          className={cn}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          {...props}
        >
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

const productLinks = [
  { href: "#features", label: "The platform" },
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Why Elitebase" },
  { href: "#faq", label: "FAQ" },
  { href: "/register", label: "Get started free" },
] as const;

const useCaseLinks = [
  { href: "#features", label: "Retail & hospitality" },
  { href: "#features", label: "Multi-location teams" },
  { href: "/register/employer", label: "Employers & managers" },
  { href: "/register/employee", label: "Hourly employees" },
  { href: "#stats", label: "Payroll-ready exports" },
] as const;

const socialLinks: {
  href: string;
  label: string;
  icon: SocialIconName;
}[] = [
  { href: "https://linkedin.com", label: "LinkedIn", icon: "linkedin" },
  { href: "https://facebook.com", label: "Facebook", icon: "facebook" },
  { href: "https://twitter.com", label: "X", icon: "x" },
  { href: "https://youtube.com", label: "YouTube", icon: "youtube" },
  { href: "/", label: "RSS", icon: "rss" },
];

/** Trust badges — layout matches Orchid footer grid; Elitebase-appropriate labels. */
const trustBadges = [
  { id: "soc2", label: "SOC 2", sub: "Type II" },
  { id: "gdpr", label: "GDPR", sub: "Ready" },
  { id: "iso", label: "ISO", sub: "27001" },
  { id: "uptime", label: "99.9%", sub: "Uptime" },
  { id: "encrypt", label: "AES", sub: "256-bit" },
  { id: "sso", label: "SSO", sub: "Ready" },
] as const;

const legalLinks = [
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
] as const;

function FooterLogo() {
  return <ElitebaseLogo className="inline-flex items-center" />;
}

function TrustBadge({
  label,
  sub,
}: {
  label: string;
  sub: string;
}) {
  return (
    <div
      className="flex aspect-square max-w-[4.5rem] flex-col items-center justify-center rounded-full border border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 px-1 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:max-w-[5rem]"
      title={`${label} ${sub}`}
    >
      <span className="text-[0.625rem] font-semibold leading-tight tracking-tight text-[var(--eb-text)] sm:text-[0.6875rem]">
        {label}
      </span>
      <span className="mt-0.5 text-[0.5625rem] leading-tight text-[var(--eb-muted)] sm:text-[0.625rem]">
        {sub}
      </span>
    </div>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative px-5 pb-16 pt-4 sm:px-8 sm:pb-20 lg:pb-24">
      <div className="mx-auto max-w-[1320px]">
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--eb-border)] bg-[var(--eb-surface)]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:rounded-[2rem]">
          <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
              {/* Brand + social */}
              <div className="lg:col-span-4 xl:col-span-3">
                <FooterLogo />
                <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                  {socialLinks.map(({ href, label, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-accent)]"
                      aria-label={label}
                    >
                      <SocialIcon
                        name={icon}
                        className="size-[1.35rem] sm:size-6"
                      />
                    </a>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div className="lg:col-span-2 lg:col-start-5">
                <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[var(--eb-text)]">
                  Product
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {productLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.875rem] leading-snug text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Use cases */}
              <div className="lg:col-span-3">
                <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-[var(--eb-text)]">
                  Use cases
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {useCaseLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.875rem] leading-snug text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust badges */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:justify-items-end">
                  {trustBadges.map((badge) => (
                    <TrustBadge
                      key={badge.id}
                      label={badge.label}
                      sub={badge.sub}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div
              className="my-8 border-t border-[var(--eb-border)] sm:my-10"
              aria-hidden
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="text-[0.8125rem] text-[var(--eb-muted)] sm:text-sm">
                © {year} All Rights Reserved, Elitebase.
              </p>
              <nav
                className="flex flex-wrap items-center gap-x-1 gap-y-2 text-[0.8125rem] sm:text-sm"
                aria-label="Legal"
              >
                {legalLinks.map((link, index) => (
                  <span key={link.label} className="inline-flex items-center">
                    {index > 0 ? (
                      <span
                        className="mx-2 text-[var(--eb-muted)]/50"
                        aria-hidden
                      >
                        ·
                      </span>
                    ) : null}
                    <Link
                      href={link.href}
                      className="text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
                    >
                      {link.label}
                    </Link>
                  </span>
                ))}
                <span className="inline-flex items-center">
                  <span
                    className="mx-2 text-[var(--eb-muted)]/50"
                    aria-hidden
                  >
                    ·
                  </span>
                  <CookieSettingsButton className="text-[0.8125rem] text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)] sm:text-sm" />
                </span>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
