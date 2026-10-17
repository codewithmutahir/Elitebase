"use client";

import { useEffect, type ReactNode } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
  type CookieConsentValue,
} from "@/lib/analytics/consent";
import {
  initPosthog,
  shutdownPosthog,
} from "@/lib/analytics/posthog-client";
import { enableSentryReplayIfConsented } from "@/lib/analytics/sentry-replay";

/**
 * Keeps PostHog + Sentry Replay aligned with cookie consent across the session.
 * Banner owns first-choice UX; this provider covers accept from settings / reload.
 */
export function PosthogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initPosthog();
      void enableSentryReplayIfConsented();
    }

    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentValue>).detail;
      if (detail === "accepted") {
        initPosthog();
        void enableSentryReplayIfConsented();
      } else if (detail === "rejected") {
        shutdownPosthog();
      }
    };

    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged);
    };
  }, []);

  return children;
}
