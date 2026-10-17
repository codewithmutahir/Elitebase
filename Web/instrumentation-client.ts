import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

/**
 * Base client Sentry init — errors/traces always (when DSN set).
 * Session Replay is attached after cookie consent via `enableSentryReplayIfConsented`.
 */
Sentry.init({
  dsn: dsn || undefined,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.15,
  // Replay sample rates apply once replayIntegration is added after consent.
  replaysSessionSampleRate: 0.15,
  replaysOnErrorSampleRate: 1.0,
  integrations: [],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
