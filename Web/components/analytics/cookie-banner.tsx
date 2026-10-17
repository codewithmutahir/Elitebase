"use client";

import { ShieldCheck } from "lucide-react";
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
  const [customizing, setCustomizing] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    const stored = getStoredCookieConsent();
    setConsent(stored);
    setAnalyticsOn(stored !== "rejected");
    setReady(true);

    if (stored === "accepted") {
      initPosthog();
      void enableSentryReplayIfConsented();
    }

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      if (detail === "accepted" || detail === "rejected") {
        setConsent(detail);
        setAnalyticsOn(detail === "accepted");
        setForceOpen(false);
        setCustomizing(false);
      }
    };

    const onOpenSettings = () => {
      setForceOpen(true);
      setCustomizing(true);
      setAnalyticsOn(getStoredCookieConsent() !== "rejected");
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
    setCustomizing(false);
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
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 sm:justify-start sm:p-6"
    >
      <div className="w-full max-w-[22rem] rounded-2xl border border-white/[0.06] bg-[var(--eb-surface,#0B1633)]/95 p-5 text-[var(--eb-text,#F5F7FB)] shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className="size-5 shrink-0 text-[var(--eb-accent,#D9A63F)]"
            aria-hidden
          />
          <h2
            id="cookie-banner-title"
            className="text-base font-semibold tracking-tight"
          >
            Your privacy matters
          </h2>
        </div>

        <p
          id="cookie-banner-desc"
          className="mt-3 text-sm leading-relaxed text-[var(--eb-muted,#A9B4CF)]"
        >
          We use essential cookies to keep Elitebase secure. With your
          permission, we also use analytics to improve your experience.
        </p>

        <Link
          href="/cookie-policy"
          className="mt-2 inline-block text-sm font-medium text-[var(--eb-accent,#D9A63F)] underline-offset-2 transition-colors hover:text-[var(--eb-gold-300,#F7DE94)] hover:underline"
        >
          Learn more about our Cookie Policy
        </Link>

        {customizing ? (
          <div className="mt-5 space-y-2">
            <div className="rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Essential</p>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--eb-muted,#A9B4CF)]">
                    Sign-in and security. Always on.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-[var(--eb-muted,#A9B4CF)]">
                  On
                </span>
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Analytics</p>
                <p className="mt-0.5 text-xs leading-snug text-[var(--eb-muted,#A9B4CF)]">
                  PostHog and Sentry (session replay masked). Optional.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsOn}
                onChange={(event) => setAnalyticsOn(event.target.checked)}
                className="size-4 shrink-0 accent-[var(--eb-accent,#D9A63F)]"
              />
            </label>
            <button
              type="button"
              onClick={() => choose(analyticsOn ? "accepted" : "rejected")}
              className="w-full rounded-xl bg-[var(--eb-accent,#D9A63F)] px-5 py-2.5 text-sm font-semibold text-[var(--eb-ink,#070F24)] transition-colors hover:bg-[var(--eb-accent-dark,#B8801F)]"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={() => setCustomizing(false)}
              className="mx-auto block text-sm text-[var(--eb-muted,#A9B4CF)] underline underline-offset-2 transition-colors hover:text-[var(--eb-text)]"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="w-full rounded-xl bg-[var(--eb-accent,#D9A63F)] px-5 py-2.5 text-sm font-semibold text-[var(--eb-ink,#070F24)] transition-colors hover:bg-[var(--eb-accent-dark,#B8801F)]"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => choose("rejected")}
              className="w-full rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--eb-text)] transition-colors hover:bg-white/5"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="mx-auto mt-0.5 text-sm text-[var(--eb-muted,#A9B4CF)] underline underline-offset-2 transition-colors hover:text-[var(--eb-text)]"
            >
              Customize preferences
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
