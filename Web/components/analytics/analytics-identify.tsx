"use client";

import { useEffect } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/analytics/consent";
import {
  identifyClientUser,
  initPosthog,
} from "@/lib/analytics/posthog-client";

type AnalyticsIdentifyProps = {
  distinctId: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

/** Call from authenticated shells after session is known. */
export function AnalyticsIdentify({
  distinctId,
  properties,
}: AnalyticsIdentifyProps) {
  const propsKey = JSON.stringify(properties ?? {});

  useEffect(() => {
    const parsed = JSON.parse(propsKey) as
      | Record<string, string | number | boolean | null | undefined>
      | Record<string, never>;

    const run = () => {
      if (!hasAnalyticsConsent()) return;
      initPosthog();
      identifyClientUser(distinctId, parsed);
    };

    run();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, run);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, run);
    };
  }, [distinctId, propsKey]);

  return null;
}
