import { cookies } from "next/headers";
import { PostHog } from "posthog-node";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  isCookieConsentValue,
} from "@/lib/analytics/consent";
import type { AnalyticsEventName } from "@/lib/analytics/events";

let client: PostHog | null = null;

function getServerPosthog(): PostHog | null {
  const key =
    process.env.POSTHOG_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return null;

  if (!client) {
    client = new PostHog(key, {
      host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ||
        "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

async function hasServerAnalyticsConsent(): Promise<boolean> {
  try {
    const jar = await cookies();
    const raw = jar.get(COOKIE_CONSENT_COOKIE_NAME)?.value;
    return isCookieConsentValue(raw) && raw === "accepted";
  } catch {
    // Outside a request context (e.g. some scripts) — do not capture.
    return false;
  }
}

/**
 * Server-side capture for actions / API routes.
 * Respects the `elitebase_cookie_consent` cookie set by the banner.
 */
export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>
): Promise<void> {
  if (!(await hasServerAnalyticsConsent())) return;

  const ph = getServerPosthog();
  if (!ph) return;

  ph.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $lib: "elitebase-server",
    },
  });

  try {
    await ph.flush();
  } catch (error) {
    console.error("[posthog] flush failed", error);
  }
}
