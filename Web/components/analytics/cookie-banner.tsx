"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  getStoredCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from "@/lib/analytics/consent";
import { enableSentryReplayIfConsented } from "@/lib/analytics/sentry-replay";
import {
  initPosthog,
  shutdownPosthog,
} from "@/lib/analytics/posthog-client";

export function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null);
  const [ready, setReady] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredCookieConsent();
    setConsent(stored);
    setReady(true);

    if (stored === "accepted") {
      initPosthog();
      void enableSentryReplayIfConsented();
    }

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      if (detail === "accepted" || detail === "rejected") {
        setConsent(detail);
        setForceOpen(false);
      }
    };

    const onOpenSettings = () => {
      setForceOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
    window.addEventListener("elitebase:open-cookie-settings", onOpenSettings);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
      window.removeEventListener(
        "elitebase:open-cookie-settings",
        onOpenSettings
      );
    };
  }, []);

  const visible = ready && (forceOpen || consent === null);
  if (!visible) return null;

  const choose = (value: CookieConsentValue) => {
    setCookieConsent(value);
    setConsent(value);
    setForceOpen(false);
    if (value === "accepted") {
      initPosthog();
      void enableSentryReplayIfConsented();
    } else {
      shutdownPosthog();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-[var(--eb-border)] bg-[var(--eb-surface,#0B1633)]/95 p-5 text-[var(--eb-text,#F5F7FB)] shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        <div className="min-w-0 flex-1 space-y-2">
          <h2
            id="cookie-banner-title"
            className="text-base font-semibold tracking-tight"
          >
            Cookies & analytics
          </h2>
          <p
            id="cookie-banner-desc"
            className="text-sm leading-relaxed text-[var(--eb-muted,#A9B4CF)]"
          >
            We use cookies for sign-in and security. With your OK, we also use
            PostHog and Sentry (including session replay) to improve the product.
            Camera previews and PIN fields are blocked or masked. See our{" "}
            <Link
              href="/cookie-policy"
              className="text-[var(--eb-gold-300,#F7DE94)] underline-offset-2 hover:underline"
            >
              Cookie Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="rounded-full border border-[var(--eb-border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--eb-text)] transition-colors hover:bg-white/5"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-full bg-[var(--eb-accent,#D9A63F)] px-5 py-2.5 text-sm font-semibold text-[var(--eb-ink,#070F24)] shadow-[0_0_24px_var(--eb-accent-glow,rgba(217,166,63,0.35))] transition-colors hover:bg-[var(--eb-accent-dark,#B8801F)]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
