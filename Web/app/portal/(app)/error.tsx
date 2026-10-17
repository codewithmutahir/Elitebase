"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { getUserFacingError } from "@/lib/errors/user-facing";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal error]", error);
    void import("@/lib/analytics/report-error").then(({ reportError }) => {
      reportError(error, { surface: "portal" });
    });
  }, [error]);

  return (
    <ErrorFallback
      variant="dashboard"
      message={getUserFacingError(error)}
      onReset={reset}
      homeHref="/portal"
      homeLabel="Back to portal"
    />
  );
}
