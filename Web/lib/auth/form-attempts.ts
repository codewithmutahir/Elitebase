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

export function useAuthFormAttempts(storageKey: string) {
  const snapshot = useSyncExternalStore(
    subscribeAttempts,
    () => getClientSnapshot(storageKey),
    getServerSnapshot
  );

  const { state } = snapshot;
  const nowMs = clockMs;

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
      emitAttemptChange();
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
  }, [storageKey]);

  const resetAttempts = useCallback(() => {
    window.localStorage.removeItem(storageKey);
    invalidateSnapshotCache(storageKey);
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
