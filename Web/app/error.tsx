"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { getUserFacingError, USER_FACING } from "@/lib/errors/user-facing";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <ErrorFallback
      variant="marketing"
      message={getUserFacingError(error)}
      onReset={reset}
      homeHref="/"
      homeLabel={USER_FACING.backToHome}
    />
  );
}
