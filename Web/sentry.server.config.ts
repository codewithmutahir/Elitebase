import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.15,
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
});

function scrubSentryEvent(
  event: Sentry.ErrorEvent
): Sentry.ErrorEvent | null {
  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (
        lower === "authorization" ||
        lower === "cookie" ||
        lower === "set-cookie" ||
        lower.includes("pin") ||
        lower.includes("token")
      ) {
        delete headers[key];
      }
    }
    event.request.headers = headers;
  }

  if (event.request?.data && typeof event.request.data === "object") {
    event.request.data = scrubRecord(
      event.request.data as Record<string, unknown>
    );
  }

  return event;
}

function scrubRecord(
  data: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("password") ||
      lower.includes("pin") ||
      lower.includes("embedding") ||
      lower.includes("face") ||
      lower.includes("token") ||
      lower.includes("authorization") ||
      lower.includes("cookie")
    ) {
      out[key] = "[Filtered]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = scrubRecord(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}
