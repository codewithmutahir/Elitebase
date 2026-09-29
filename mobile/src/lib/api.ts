import axios from "axios";
import { isKioskApiUrl, isKioskAuthUrl } from "@/lib/apiPaths";
import { getTabletToken } from "@/lib/storage";

/** Production web app — used when EXPO_PUBLIC_API_URL is missing (common after OTA). */
export const DEFAULT_PRODUCTION_API_URL = "https://elitebase-neon.vercel.app";

export function getApiBaseUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Release / OTA bundles must never ship without a server URL.
  if (!__DEV__) return DEFAULT_PRODUCTION_API_URL;
  return "";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  // Re-resolve on every request so OTA / env fixes apply even if the module
  // was first evaluated with an empty URL.
  config.baseURL = getApiBaseUrl();

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
  async (response) => {
    const url = response.config?.url ?? "";
    if (isKioskApiUrl(url)) {
      const { noteTabletAuthSuccess } = await import("@/lib/tabletSession");
      noteTabletAuthSuccess();
    }
    return response;
  },
  async (error) => {
    const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";
    const isKioskRoute = isKioskAuthUrl(url);

    if (isKioskRoute) {
      const { handleTabletAuthFailure } = await import("@/lib/tabletSession");
      await handleTabletAuthFailure(error);
    }

    return Promise.reject(error);
  }
);
