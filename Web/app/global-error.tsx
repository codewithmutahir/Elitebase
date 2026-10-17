"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { getUserFacingError, USER_FACING } from "@/lib/errors/user-facing";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
    void import("@/lib/analytics/report-error").then(({ reportError }) => {
      reportError(error, { surface: "marketing" });
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--eb-ink,#060A12)] font-sans antialiased">
        <ErrorFallback
          variant="marketing"
          message={getUserFacingError(error)}
          onReset={reset}
          homeHref="/"
          homeLabel={USER_FACING.backToHome}
        />
      </body>
    </html>
  );
}
