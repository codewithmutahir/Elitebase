"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const AUTH_FORM_MAX_ATTEMPTS = 5;
/** Matches server sliding window when Upstash is configured. */
export const AUTH_FORM_LOCKOUT_MS = 15 * 60 * 1000;

type AttemptState = {
  count: number;
  lockedUntil: number | null;
};

function readState(storageKey: string): AttemptState {
  if (typeof window === "undefined") {
    return { count: 0, lockedUntil: null };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { count: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as AttemptState;
    if (
      typeof parsed.count !== "number" ||
      (parsed.lockedUntil !== null && typeof parsed.lockedUntil !== "number")
    ) {
      return { count: 0, lockedUntil: null };
    }
    return parsed;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeState(storageKey: string, state: AttemptState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function useAuthFormAttempts(storageKey: string) {
  const [tick, setTick] = useState(0);
  /** Avoid SSR/client mismatch from localStorage lockout before hydration. */
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [refresh, hydrated]);

  const state = useMemo(() => {
    if (!hydrated) {
      return { count: 0, lockedUntil: null };
    }
    return readState(storageKey);
  }, [storageKey, tick, hydrated]);

  const now = Date.now();
  const isLocked =
    state.lockedUntil !== null && now < state.lockedUntil;

  const attemptsUsed = isLocked
    ? AUTH_FORM_MAX_ATTEMPTS
    : Math.min(state.count, AUTH_FORM_MAX_ATTEMPTS);

  const attemptsRemaining = Math.max(0, AUTH_FORM_MAX_ATTEMPTS - attemptsUsed);

  const lockSecondsLeft = isLocked
    ? Math.ceil((state.lockedUntil! - now) / 1000)
    : 0;

  const lockMessage = isLocked
    ? `Too many attempts. Try again in ${formatLockDuration(lockSecondsLeft)}.`
    : attemptsRemaining <= 2 && attemptsRemaining > 0
      ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left before a temporary lockout.`
      : null;

  const consumeAttempt = useCallback((): boolean => {
    let current = readState(storageKey);
    const time = Date.now();

    if (current.lockedUntil !== null && time >= current.lockedUntil) {
      current = { count: 0, lockedUntil: null };
    }

    if (current.lockedUntil !== null && time < current.lockedUntil) {
      refresh();
      return false;
    }

    if (current.count >= AUTH_FORM_MAX_ATTEMPTS) {
      current = {
        count: current.count,
        lockedUntil: time + AUTH_FORM_LOCKOUT_MS,
      };
      writeState(storageKey, current);
      refresh();
      return false;
    }

    const nextCount = current.count + 1;
    const next: AttemptState = {
      count: nextCount,
      lockedUntil:
        nextCount >= AUTH_FORM_MAX_ATTEMPTS
          ? time + AUTH_FORM_LOCKOUT_MS
          : null,
    };
    writeState(storageKey, next);
    refresh();
    return true;
  }, [storageKey, refresh]);

  const resetAttempts = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    refresh();
  }, [storageKey, refresh]);

  return {
    canSubmit: !isLocked && state.count < AUTH_FORM_MAX_ATTEMPTS,
    isLocked,
    attemptsRemaining,
    lockMessage,
    consumeAttempt,
    resetAttempts,
  };
}

function formatLockDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
