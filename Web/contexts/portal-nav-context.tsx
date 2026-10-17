"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { setNavigationPending } from "@/lib/navigation/navigation-pending-store";

type PortalNavContextValue = {
  pending: boolean;
  pendingHref: string | null;
  navigate: (href: string) => void;
};

const PortalNavContext = createContext<PortalNavContextValue | null>(null);

export function PortalNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) {
      setPendingHref(null);
      setNavigationPending(false);
    }
  }, [pending]);

  const navigate = useCallback(
    (href: string) => {
      if (pending) return;
      try {
        const url = new URL(href, window.location.origin);
        if (
          url.pathname === pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        if (href === pathname) return;
      }
      setPendingHref(href);
      setNavigationPending(true);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, pending, router]
  );

  const value = useMemo(
    () => ({ pending, pendingHref, navigate }),
    [pending, pendingHref, navigate]
  );

  return (
    <PortalNavContext.Provider value={value}>
      {children}
    </PortalNavContext.Provider>
  );
}

export function usePortalNav() {
  const ctx = useContext(PortalNavContext);
  if (!ctx) {
    throw new Error("usePortalNav must be used within PortalNavProvider");
  }
  return ctx;
}
