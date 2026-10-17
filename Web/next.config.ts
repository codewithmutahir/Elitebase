import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/** Keep aligned with `MAX_EMPLOYEE_CSV_BYTES` in lib/employees/csv-import-limits.ts */
const SERVER_ACTION_BODY_LIMIT = "5mb";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    serverActions: {
      bodySizeLimit: SERVER_ACTION_BODY_LIMIT,
    },
  },
  // Monorepo has lockfiles at repo root + Web/ — pin Turbopack to this app.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Matches `npx @sentry/wizard … --org elite-solution-usa --project elitebase-web`
  org: process.env.SENTRY_ORG || "elite-solution-usa",
  project: process.env.SENTRY_PROJECT || "elitebase-web",
  // Loaded from env / `.env.sentry-build-plugin` during `next build`
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Avoid ad-blockers dropping events (wizard default pattern)
  tunnelRoute: "/monitoring",
});
