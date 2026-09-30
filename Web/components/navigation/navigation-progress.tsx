"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MAX_PROGRESS = 0.92;
const START_SCALE = 0.08;
const TICK_FACTOR = 0.09;
const STUCK_TIMEOUT_MS = 12_000;
const FADE_OUT_MS = 180;

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
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
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
  const activeRef = useRef(false);
  const valueRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (fadeRef.current) {
      clearTimeout(fadeRef.current);
      fadeRef.current = null;
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
    valueRef.current = Math.min(MAX_PROGRESS, valueRef.current + Math.max(delta, 0.004));
    paint(valueRef.current, 1);

    if (valueRef.current < MAX_PROGRESS) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [paint]);

  const start = useCallback(() => {
    if (activeRef.current) return;

    clearTimers();
    cancelAnimationFrame(rafRef.current);

    activeRef.current = true;
    valueRef.current = START_SCALE;
    paint(START_SCALE, 1);
    rafRef.current = requestAnimationFrame(tick);

    timeoutRef.current = setTimeout(() => {
      activeRef.current = false;
      paint(1, 0);
      valueRef.current = 0;
    }, STUCK_TIMEOUT_MS);
  }, [clearTimers, paint, tick]);

  const done = useCallback(() => {
    if (!activeRef.current) return;

    clearTimers();
    cancelAnimationFrame(rafRef.current);
    activeRef.current = false;
    valueRef.current = 1;
    paint(1, 1);

    fadeRef.current = setTimeout(() => {
      valueRef.current = 0;
      paint(0, 0);
    }, FADE_OUT_MS);
  }, [clearTimers, paint]);

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
      start();
    };

    const onPopState = () => start();

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      start();
      return originalPushState(...args);
    };

    history.replaceState = (...args) => {
      start();
      return originalReplaceState(...args);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [pathname, searchParams, start]);

  useEffect(() => {
    done();
  }, [pathname, searchParams, done]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearTimers();
    },
    [clearTimers]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px] motion-reduce:hidden"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-[var(--eb-accent,#2ec4b6)] will-change-transform"
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
