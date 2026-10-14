"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export const AUTH_FORM_MAX_ATTEMPTS = 5;
/** Matches server sliding window when Upstash is configured. */
export const AUTH_FORM_LOCKOUT_MS = 15 * 60 * 1000;

type AttemptState = {
  count: number;
  lockedUntil: number | null;
};

const EMPTY_STATE: AttemptState = { count: 0, lockedUntil: null };

/** Snapshot for useSyncExternalStore — stable reference until state or clock tick changes. */
type AttemptSnapshot = {
  state: AttemptState;
  clockTick: number;
};

const SERVER_SNAPSHOT: AttemptSnapshot = { state: EMPTY_STATE, clockTick: 0 };

const listeners = new Set<() => void>();

let clockMs = 0;
let subscriberCount = 0;
let clockTimer: number | null = null;

const snapshotCache = new Map<
  string,
  { snap: AttemptSnapshot; serialized: string; clockTick: number }
>();

function pendingKey(storageKey: string) {
  return `${storageKey}:pending`;
}

function emitAttemptChange() {
  for (const listener of listeners) {
    listener();
  }
}

function invalidateSnapshotCache(storageKey?: string) {
  if (storageKey) {
    snapshotCache.delete(storageKey);
    return;
  }
  snapshotCache.clear();
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
    if (parsed.count === 0 && parsed.lockedUntil === null) {
      return EMPTY_STATE;
    }
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(storageKey: string, state: AttemptState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
  invalidateSnapshotCache(storageKey);
  emitAttemptChange();
}

function clearExpiredLock(storageKey: string, state: AttemptState, time: number) {
  if (state.lockedUntil !== null && time >= state.lockedUntil) {
    writeState(storageKey, EMPTY_STATE);
    return EMPTY_STATE;
  }
  return state;
}

function onStorageEvent(event: StorageEvent) {
  if (event.key != null) {
    invalidateSnapshotCache(event.key);
  }
  emitAttemptChange();
}

function startClock() {
  if (typeof window === "undefined" || clockTimer !== null) return;
  clockMs = Date.now();
  clockTimer = window.setInterval(() => {
    clockMs = Date.now();
    emitAttemptChange();
  }, 1000);
  window.addEventListener("storage", onStorageEvent);
}

function stopClock() {
  if (clockTimer !== null) {
    window.clearInterval(clockTimer);
    clockTimer = null;
  }
  window.removeEventListener("storage", onStorageEvent);
}

function subscribeAttempts(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  subscriberCount += 1;
  if (subscriberCount === 1) {
    startClock();
  }

  return () => {
    listeners.delete(onStoreChange);
    subscriberCount = Math.max(0, subscriberCount - 1);
    if (subscriberCount === 0) {
      stopClock();
    }
  };
}

function getClientSnapshot(storageKey: string): AttemptSnapshot {
  const state = readState(storageKey);
  const serialized = JSON.stringify(state);
  const clockTick = Math.floor(clockMs / 1000);

  const cached = snapshotCache.get(storageKey);
  if (
    cached &&
    cached.serialized === serialized &&
    cached.clockTick === clockTick
  ) {
    return cached.snap;
  }

  const snap: AttemptSnapshot = { state, clockTick };
  snapshotCache.set(storageKey, { snap, serialized, clockTick });
  return snap;
}

function getServerSnapshot(): AttemptSnapshot {
  return SERVER_SNAPSHOT;
}

function recordFailedAttemptForKey(storageKey: string): void {
  let current = clearExpiredLock(storageKey, readState(storageKey), Date.now());
  const time = Date.now();

  if (current.lockedUntil !== null && time < current.lockedUntil) {
    emitAttemptChange();
    return;
  }

  const nextCount = current.count + 1;
  writeState(storageKey, {
    count: nextCount,
    lockedUntil:
      nextCount >= AUTH_FORM_MAX_ATTEMPTS ? time + AUTH_FORM_LOCKOUT_MS : null,
  });
}

/**
 * Client-side lockout paired with server IP limits.
 * Only **failed** attempts count — call `beginAttempt` before the server action,
 * and pass `failureSignal` when the page reloads with an auth error.
 */
export function useAuthFormAttempts(
  storageKey: string,
  failureSignal: string | null = null
) {
  const snapshot = useSyncExternalStore(
    subscribeAttempts,
    () => getClientSnapshot(storageKey),
    getServerSnapshot
  );

  const { state } = snapshot;
  const nowMs = clockMs;

  const lockExpired =
    state.lockedUntil !== null && nowMs > 0 && nowMs >= state.lockedUntil;
  const effectiveState = lockExpired ? EMPTY_STATE : state;

  const isLocked =
    effectiveState.lockedUntil !== null &&
    nowMs > 0 &&
    nowMs < effectiveState.lockedUntil;

  const attemptsUsed = isLocked
    ? AUTH_FORM_MAX_ATTEMPTS
    : Math.min(effectiveState.count, AUTH_FORM_MAX_ATTEMPTS);

  const attemptsRemaining = Math.max(0, AUTH_FORM_MAX_ATTEMPTS - attemptsUsed);

  const lockSecondsLeft =
    isLocked && effectiveState.lockedUntil !== null
      ? Math.ceil((effectiveState.lockedUntil - nowMs) / 1000)
      : 0;

  const lockMessage = isLocked
    ? `Too many attempts. Try again in ${formatLockDuration(lockSecondsLeft)}.`
    : attemptsRemaining <= 2 && attemptsRemaining > 0
      ? `${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left before a temporary lockout.`
      : null;

  useEffect(() => {
    if (lockExpired && state.lockedUntil !== null) {
      writeState(storageKey, EMPTY_STATE);
    }
  }, [lockExpired, state.lockedUntil, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let pending = false;
    try {
      pending = window.sessionStorage.getItem(pendingKey(storageKey)) === "1";
      if (pending) {
        window.sessionStorage.removeItem(pendingKey(storageKey));
      }
    } catch {
      return;
    }

    // Success (or clean visit): pending cleared, no failure signal → do not count.
    if (!pending || !failureSignal) return;

    recordFailedAttemptForKey(storageKey);
  }, [storageKey, failureSignal]);

  /** Mark a submit in-flight. Counts only if the next render has `failureSignal`. */
  const beginAttempt = useCallback((): boolean => {
    let current = clearExpiredLock(
      storageKey,
      readState(storageKey),
      Date.now()
    );
    const time = Date.now();

    if (current.lockedUntil !== null && time < current.lockedUntil) {
      emitAttemptChange();
      return false;
    }

    if (current.count >= AUTH_FORM_MAX_ATTEMPTS) {
      writeState(storageKey, {
        count: current.count,
        lockedUntil: time + AUTH_FORM_LOCKOUT_MS,
      });
      return false;
    }

    try {
      window.sessionStorage.setItem(pendingKey(storageKey), "1");
    } catch {
      // sessionStorage unavailable — still allow submit; server limit remains
    }
    return true;
  }, [storageKey]);

  /** @deprecated Use beginAttempt + failureSignal so successes are not counted. */
  const consumeAttempt = useCallback((): boolean => {
    return beginAttempt();
  }, [beginAttempt]);

  const resetAttempts = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    try {
      window.sessionStorage.removeItem(pendingKey(storageKey));
    } catch {
      // ignore
    }
    invalidateSnapshotCache(storageKey);
    emitAttemptChange();
  }, [storageKey]);

  return {
    canSubmit: !isLocked && effectiveState.count < AUTH_FORM_MAX_ATTEMPTS,
    isLocked,
    attemptsRemaining,
    lockMessage,
    beginAttempt,
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
