import axios from "axios";
import {
  clearTabletConfig,
  getTabletConfig,
  getTabletToken,
  saveTabletConfig,
} from "@/lib/storage";
import type { TabletConfig } from "@/types";
import { api } from "@/lib/api";

export type ValidateTabletResponse = {
  tablet_id: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  location_name: string;
};

const TABLET_SESSION_ERRORS = new Set([
  "Missing tablet token.",
  "Invalid tablet token.",
  "This tablet has been deactivated.",
]);

type SessionInvalidListener = () => void;
const listeners = new Set<SessionInvalidListener>();

export function subscribeTabletSessionInvalidated(
  listener: SessionInvalidListener
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function invalidateTabletSession() {
  await clearTabletConfig();
  for (const listener of listeners) {
    listener();
  }
}

export function isTabletSessionError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || !error.response) return false;

  const status = error.response.status;
  const message =
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof (error.response.data as { error: unknown }).error === "string"
      ? (error.response.data as { error: string }).error
      : "";

  if (status === 401) return true;
  return status === 403 && TABLET_SESSION_ERRORS.has(message);
}

/** Returns false when the stored tablet token is missing or rejected by the server. */
export async function validateTabletSession(): Promise<boolean> {
  const token = await getTabletToken();
  if (!token) return false;

  try {
    const { data } = await api.post<ValidateTabletResponse>(
      "/api/kiosk/validate-tablet",
      {}
    );
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
    if (isTabletSessionError(error)) {
      await invalidateTabletSession();
      return false;
    }
    throw error;
  }
}
