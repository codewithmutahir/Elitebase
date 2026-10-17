"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { setNavigationPending } from "@/lib/navigation/navigation-pending-store";

/**
 * Soft-navigate with a pending lock so rapid clicks do not stack.
 * `activeKey` identifies which control triggered navigation (only that one
 * should show a loading label; siblings can stay disabled).
 *
 * Pending stays true until the App Router transition finishes — use that to
 * swap in skeletons (same pattern as timesheets).
 */
export function usePendingNavigation<T extends string = string>() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeKey, setActiveKey] = useState<T | null>(null);

  useEffect(() => {
    if (!pending) {
      setActiveKey(null);
      setNavigationPending(false);
    }
  }, [pending]);

  const navigate = useCallback(
    (href: string, key?: T) => {
      if (pending) return;
      if (key !== undefined) setActiveKey(key);
      setNavigationPending(true);
      startTransition(() => {
        router.push(href);
      });
    },
    [pending, router]
  );

  return { pending, activeKey, navigate };
}
