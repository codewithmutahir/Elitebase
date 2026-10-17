"use client";

import * as Sentry from "@sentry/nextjs";
import { hasAnalyticsConsent } from "@/lib/analytics/consent";

let replayAttached = false;

/**
 * Lazily attach Sentry Session Replay only after analytics consent.
 * Errors still report without consent via base Sentry.init.
 */
export async function enableSentryReplayIfConsented(): Promise<void> {
  if (typeof window === "undefined" || replayAttached) return;
  if (!hasAnalyticsConsent()) return;
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;

  try {
    const { replayIntegration } = await import("@sentry/nextjs");
    Sentry.addIntegration(
      replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
        block: [".eb-replay-block", "video"],
      })
    );
    replayAttached = true;
  } catch (error) {
    console.error("[sentry] failed to enable session replay", error);
  }
}

export function disableSentryReplay(): void {
  // Sentry has no clean public "remove replay" API; next full page load
  // without consent will init without Replay. Flag prevents re-attach this session.
  replayAttached = true;
}
