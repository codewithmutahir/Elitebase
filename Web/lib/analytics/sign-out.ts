"use client";

import { authClient } from "@/lib/auth-client";
import { resetClientAnalytics } from "@/lib/analytics/posthog-client";

/** Clears analytics identity then signs out via Better Auth. */
export function signOutAndResetAnalytics(redirectTo = "/login"): void {
  resetClientAnalytics();
  authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = redirectTo;
      },
    },
  });
}
