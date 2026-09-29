import axios from "axios";
import {
  clearTabletConfig,
  getTabletConfig,
  getTabletToken,
  saveTabletConfig,
} from "@/lib/storage";
import type { TabletConfig } from "@/types";
import { api } from "@/lib/api";
import { MOBILE_API } from "@/lib/apiPaths";

export type ValidateTabletResponse = {
  tablet_id: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  location_name: string;
};

/** Only these server messages mean the tablet must re-pair. */
const HARD_SESSION_ERRORS = new Set([
  "Invalid tablet token.",
  "This tablet has been deactivated.",
]);

/** Require repeated confirmation before wiping SecureStore (avoids OTA / proxy 401s). */
const INVALID_TOKEN_CLEAR_THRESHOLD = 2;

type SessionInvalidListener = () => void;
const listeners = new Set<SessionInvalidListener>();

let consecutiveInvalidTokenFailures = 0;
let invalidateInFlight: Promise<void> | null = null;

export function subscribeTabletSessionInvalidated(
  listener: SessionInvalidListener
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function invalidateTabletSession() {
  if (invalidateInFlight) {
    await invalidateInFlight;
    return;
  }

  invalidateInFlight = (async () => {
    consecutiveInvalidTokenFailures = 0;
    await clearTabletConfig();
    for (const listener of listeners) {
      listener();
    }
  })();

  try {
    await invalidateInFlight;
  } finally {
    invalidateInFlight = null;
  }
}

function getAxiosErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response) return "";

  const data = error.response.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }

  return "";
}

/**
 * Classify kiosk auth failures.
 * Bare 401/403 (HTML auth walls, wrong host, CDN) are NOT session failures.
 * "Missing tablet token." is a client header race — never wipe for it.
 */
export function getTabletAuthFailureKind(
  error: unknown
): "invalid_token" | "deactivated" | null {
  if (!axios.isAxiosError(error) || !error.response) return null;

  const status = error.response.status;
  const message = getAxiosErrorMessage(error);

  if (!HARD_SESSION_ERRORS.has(message)) return null;

  if (status === 401 && message === "Invalid tablet token.") {
    return "invalid_token";
  }
  if (status === 403 && message === "This tablet has been deactivated.") {
    return "deactivated";
  }

  return null;
}

/** @deprecated Prefer getTabletAuthFailureKind — kept for call sites that only need a boolean. */
export function isTabletSessionError(error: unknown): boolean {
  return getTabletAuthFailureKind(error) !== null;
}

/**
 * Decide whether a failed kiosk response should clear registration.
 * Deactivation clears immediately; invalid token needs consecutive confirmations.
 * Returns true when SecureStore was cleared.
 */
export async function handleTabletAuthFailure(
  error: unknown
): Promise<boolean> {
  const kind = getTabletAuthFailureKind(error);
  if (!kind) {
    return false;
  }

  if (kind === "deactivated") {
    await invalidateTabletSession();
    return true;
  }

  consecutiveInvalidTokenFailures += 1;
  if (consecutiveInvalidTokenFailures < INVALID_TOKEN_CLEAR_THRESHOLD) {
    console.warn(
      `[tabletSession] Invalid tablet token (${consecutiveInvalidTokenFailures}/${INVALID_TOKEN_CLEAR_THRESHOLD}); keeping registration`
    );
    return false;
  }

  await invalidateTabletSession();
  return true;
}

export function noteTabletAuthSuccess() {
  consecutiveInvalidTokenFailures = 0;
}

/** Returns false when the stored tablet token is missing or confirmed rejected. */
export async function validateTabletSession(): Promise<boolean> {
  const token = await getTabletToken();
  if (!token) return false;

  try {
    const { data } = await api.post<ValidateTabletResponse>(
      MOBILE_API.kiosk.validateTablet,
      {}
    );
    noteTabletAuthSuccess();
    const existing = await getTabletConfig();
    if (existing) {
      const updated: TabletConfig = {
        ...existing,
        company_id: data.company_id,
        company_name: data.company_name,
        company_logo_url: data.company_logo_url,
        location_name: data.location_name,
      };
      await saveTabletConfig(updated);
    }
    return true;
  } catch (error) {
    // Axios interceptor already ran handleTabletAuthFailure for this response.
    if (getTabletAuthFailureKind(error)) {
      const stillRegistered = await getTabletToken();
      return Boolean(stillRegistered);
    }
    throw error;
  }
}
