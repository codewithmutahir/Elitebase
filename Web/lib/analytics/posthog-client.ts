"use client";

import posthog from "posthog-js";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import { hasAnalyticsConsent } from "@/lib/analytics/consent";

const REPLAY_BLOCK_SELECTOR = ".eb-replay-block, video";

let initialized = false;

function posthogKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

function posthogHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com"
  );
}

export function isPosthogEnabled(): boolean {
  return Boolean(posthogKey()) && hasAnalyticsConsent();
}

export function initPosthog(): void {
  if (typeof window === "undefined" || initialized) return;
  if (!hasAnalyticsConsent()) return;

  const key = posthogKey();
  if (!key) return;

  posthog.init(key, {
    api_host: posthogHost(),
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    mask_all_text: false,
    mask_all_element_attributes: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: ".eb-replay-mask",
      blockSelector: REPLAY_BLOCK_SELECTOR,
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug(false);
      }
    },
  });

  initialized = true;
}

export function shutdownPosthog(): void {
  if (!initialized) return;
  try {
    posthog.capture("$opt_out");
    posthog.opt_out_capturing();
    posthog.reset();
  } catch {
    // ignore
  }
  initialized = false;
}

export function captureClientEvent(
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!isPosthogEnabled() || !initialized) return;
  posthog.capture(event, properties);
}

export function identifyClientUser(
  distinctId: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  if (!isPosthogEnabled() || !initialized) return;
  posthog.identify(distinctId, properties);
}

export function resetClientAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
