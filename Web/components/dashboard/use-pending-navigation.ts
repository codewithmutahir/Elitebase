"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

/**
 * Soft-navigate with a pending lock so rapid clicks do not stack.
 * `activeKey` identifies which control triggered navigation (only that one
 * should show a loading label; siblings can stay disabled).
 */
export function usePendingNavigation<T extends string = string>() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeKey, setActiveKey] = useState<T | null>(null);

  useEffect(() => {
    if (!pending) setActiveKey(null);
  }, [pending]);

  const navigate = useCallback(
    (href: string, key?: T) => {
      if (pending) return;
      if (key !== undefined) setActiveKey(key);
      startTransition(() => {
        router.push(href);
      });
    },
    [pending, router]
  );

  return { pending, activeKey, navigate };
}
