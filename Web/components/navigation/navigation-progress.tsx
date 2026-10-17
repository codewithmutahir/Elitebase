"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getNavigationPending,
  setNavigationPending,
  subscribeNavigationPending,
} from "@/lib/navigation/navigation-pending-store";

const MAX_PROGRESS = 0.92;
const START_SCALE = 0.08;
const TICK_FACTOR = 0.09;
const STUCK_TIMEOUT_MS = 12_000;
const FADE_OUT_MS = 180;
const MIN_VISIBLE_MS = 280;

function isModifiedClick(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.defaultPrevented
  );
}

function isInternalNavigation(anchor: HTMLAnchorElement, origin: string) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    return new URL(href, origin).origin === origin;
  } catch {
    return false;
  }
}

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minVisibleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const valueRef = useRef(0);
  const startedAtRef = useRef(0);
  /** True when this bar armed pending for a plain <a> click (no useTransition owner). */
  const ownsPendingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (fadeRef.current) {
      clearTimeout(fadeRef.current);
      fadeRef.current = null;
    }
    if (minVisibleRef.current) {
      clearTimeout(minVisibleRef.current);
      minVisibleRef.current = null;
    }
  }, []);

  const paint = useCallback((scale: number, opacity: number) => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transform = `scaleX(${scale})`;
    bar.style.opacity = String(opacity);
  }, []);

  const tick = useCallback(() => {
    if (!activeRef.current) return;

    const delta = (MAX_PROGRESS - valueRef.current) * TICK_FACTOR;
    valueRef.current = Math.min(
      MAX_PROGRESS,
      valueRef.current + Math.max(delta, 0.004)
    );
    paint(valueRef.current, 1);

    if (valueRef.current < MAX_PROGRESS) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [paint]);

  const finishPaint = useCallback(() => {
    activeRef.current = false;
    valueRef.current = 1;
    paint(1, 1);

    fadeRef.current = setTimeout(() => {
      valueRef.current = 0;
      paint(0, 0);
    }, FADE_OUT_MS);
  }, [paint]);

  const beginAnimation = useCallback(() => {
    clearTimers();
    cancelAnimationFrame(rafRef.current);

    activeRef.current = true;
    startedAtRef.current = Date.now();
    valueRef.current = START_SCALE;
    paint(START_SCALE, 1);
    rafRef.current = requestAnimationFrame(tick);

    timeoutRef.current = setTimeout(() => {
      if (ownsPendingRef.current) {
        ownsPendingRef.current = false;
        setNavigationPending(false);
      }
      finishPaint();
    }, STUCK_TIMEOUT_MS);
  }, [clearTimers, finishPaint, paint, tick]);

  const endAnimation = useCallback(() => {
    if (!activeRef.current) return;

    clearTimers();
    cancelAnimationFrame(rafRef.current);

    const elapsed = Date.now() - startedAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const finish = () => {
      if (ownsPendingRef.current) {
        ownsPendingRef.current = false;
        setNavigationPending(false);
      }
      finishPaint();
    };

    if (wait === 0) {
      finish();
      return;
    }

    minVisibleRef.current = setTimeout(finish, wait);
  }, [clearTimers, finishPaint]);

  useEffect(() => {
    return subscribeNavigationPending((pending) => {
      if (pending) beginAnimation();
      else endAnimation();
    });
  }, [beginAnimation, endAnimation]);

  useEffect(() => {
    const origin = window.location.origin;
    const currentRoute = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

    const onClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || !isInternalNavigation(anchor, origin)) return;

      const nextRoute = (() => {
        try {
          const url = new URL(anchor.getAttribute("href") ?? "", origin);
          return `${url.pathname}${url.search}`;
        } catch {
          return null;
        }
      })();

      if (!nextRoute || nextRoute === currentRoute) return;

      // Plain links: we own pending until the URL settles.
      ownsPendingRef.current = true;
      setNavigationPending(true);
    };

    const onPopState = () => {
      ownsPendingRef.current = true;
      setNavigationPending(true);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!ownsPendingRef.current) return;
    endAnimation();
  }, [pathname, searchParams, endAnimation]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimers();
      if (ownsPendingRef.current || getNavigationPending()) {
        ownsPendingRef.current = false;
        setNavigationPending(false);
      }
    },
    [clearTimers]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--eb-accent,#d9a63f)] shadow-[0_0_12px_var(--eb-accent-glow,rgba(217,166,63,0.35))] will-change-transform"
        style={{
          transform: "scaleX(0)",
          opacity: 0,
          transition: "transform 180ms ease-out, opacity 140ms ease-out",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
