import * as Sentry from "@sentry/nextjs";

type ReportErrorContext = {
  surface?: "dashboard" | "portal" | "kiosk" | "auth" | "marketing" | "cron";
  companyId?: string;
  route?: string;
  extra?: Record<string, string | number | boolean | null | undefined>;
};

export function reportError(
  error: unknown,
  context?: ReportErrorContext
): void {
  Sentry.withScope((scope) => {
    if (context?.surface) scope.setTag("surface", context.surface);
    if (context?.companyId) scope.setTag("companyId", context.companyId);
    if (context?.route) scope.setTag("route", context.route);
    if (context?.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        if (value !== undefined) scope.setExtra(key, value);
      }
    }
    Sentry.captureException(error);
  });
}
