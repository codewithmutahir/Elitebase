"use client";

import { useCallback, useSyncExternalStore } from "react";

export const AUTH_FORM_MAX_ATTEMPTS = 5;
/** Matches server sliding window when Upstash is configured. */
export const AUTH_FORM_LOCKOUT_MS = 15 * 60 * 1000;

type AttemptState = {
  count: number;
  lockedUntil: number | null;
};

const EMPTY_STATE: AttemptState = { count: 0, lockedUntil: null };

const listeners = new Set<() => void>();

function emitAttemptChange() {
  for (const listener of listeners) {
    listener();
  }
}

function readState(storageKey: string): AttemptState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as AttemptState;
    if (
      typeof parsed.count !== "number" ||
      (parsed.lockedUntil !== null && typeof parsed.lockedUntil !== "number")
    ) {
      return EMPTY_STATE;
    }
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(storageKey: string, state: AttemptState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  emitAttemptChange();
}

function subscribeAttempts(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const timer = window.setInterval(onStoreChange, 1000);
  const onStorage = (event: StorageEvent) => {
    if (event.key != null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onStoreChange);
    window.clearInterval(timer);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerAttemptSnapshot(): AttemptState {
  return EMPTY_STATE;
}

export function useAuthFormAttempts(storageKey: string) {
  const state = useSyncExternalStore(
    subscribeAttempts,
    () => readState(storageKey),
    getServerAttemptSnapshot
  );

  const refresh = useCallback(() => emitAttemptChange(), []);

  const nowMs = useSyncExternalStore(
    subscribeAttempts,
    () => Date.now(),
    () => 0
  );

  const isLocked =
    state.lockedUntil !== null && nowMs > 0 && nowMs < state.lockedUntil;

  const attemptsUsed = isLocked
    ? AUTH_FORM_MAX_ATTEMPTS
    : Math.min(state.count, AUTH_FORM_MAX_ATTEMPTS);

  const attemptsRemaining = Math.max(0, AUTH_FORM_MAX_ATTEMPTS - attemptsUsed);

  const lockSecondsLeft =
    isLocked && state.lockedUntil !== null
      ? Math.ceil((state.lockedUntil - nowMs) / 1000)
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
      current = EMPTY_STATE;
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
    return true;
  }, [storageKey, refresh]);

  const resetAttempts = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    emitAttemptChange();
  }, [storageKey]);

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
