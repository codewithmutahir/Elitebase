import axios from "axios";
import { getTabletToken } from "@/lib/storage";

const TABLET_SESSION_ERRORS = new Set([
  "Missing tablet token.",
  "Invalid tablet token.",
  "This tablet has been deactivated.",
]);

function isTabletAuthFailure(error: unknown): boolean {
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

export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const tabletToken = await getTabletToken();
  if (tabletToken) {
    config.headers["x-tablet-token"] = tabletToken;
  }

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // RN multipart needs the runtime-generated boundary. Never force
    // application/json or bare multipart/form-data here.
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
      delete (config.headers as Record<string, unknown>)["content-type"];
    }
  } else if (
    config.data != null &&
    typeof config.data === "object" &&
    !config.headers?.["Content-Type"] &&
    !config.headers?.["content-type"]
  ) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
    const isKioskRoute =
      url.includes("/api/kiosk/") && !url.includes("/register-tablet");

    if (isKioskRoute && isTabletAuthFailure(error)) {
      const { invalidateTabletSession } = await import("@/lib/tabletSession");
      await invalidateTabletSession();
    }

    return Promise.reject(error);
  }
);
