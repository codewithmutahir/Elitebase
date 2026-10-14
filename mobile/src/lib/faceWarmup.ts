import { api, getApiBaseUrl } from "@/lib/api";
import { MOBILE_API } from "@/lib/apiPaths";
import { getTabletToken } from "@/lib/storage";

/** Face verify/register can wait on Render cold start + model load. */
export const FACE_API_TIMEOUT_MS = 90_000;

/** Warmup may load buffalo_sc into memory on a cold Render instance. */
export const FACE_WARMUP_TIMEOUT_MS = 90_000;

export type FaceWarmupResult = {
  ok: boolean;
  warmed: boolean;
  modelLoaded: boolean | null;
  status: string | number | null;
};

/**
 * Wake the Python face service via Next.js.
 * Returns structured status (never throws).
 */
export async function warmupFaceService(): Promise<FaceWarmupResult> {
  try {
    const tabletToken = await getTabletToken();
    if (!tabletToken) {
      return { ok: false, warmed: false, modelLoaded: null, status: "no_token" };
    }

    const { data } = await api.post<{
      warmed?: boolean;
      model_loaded?: boolean | null;
      status?: string | number;
    }>(
      MOBILE_API.kiosk.faceWarmup,
      {},
      {
        headers: { "x-tablet-token": tabletToken },
        timeout: FACE_WARMUP_TIMEOUT_MS,
      }
    );

    return {
      ok: true,
      warmed: Boolean(data?.warmed),
      modelLoaded:
        typeof data?.model_loaded === "boolean" ? data.model_loaded : null,
      status: data?.status ?? null,
    };
  } catch {
    return { ok: false, warmed: false, modelLoaded: null, status: "unreachable" };
  }
}

type RnFilePart = {
  uri: string;
  type: string;
  name: string;
};

/**
 * Register face via fetch (more reliable than axios for RN multipart).
 * Throws Error with a user-facing message on failure.
 */
export async function registerFaceMultipart(options: {
  uris: string[];
  employeeId: string;
  timeoutMs?: number;
}): Promise<void> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      "App is missing EXPO_PUBLIC_API_URL. Rebuild the production APK."
    );
  }

  const tabletToken = await getTabletToken();
  if (!tabletToken) {
    throw new Error("Tablet session missing. Reconnect this tablet.");
  }

  const formData = new FormData();
  options.uris.forEach((uri, index) => {
    const part: RnFilePart = {
      uri,
      type: "image/jpeg",
      name: `face_${index + 1}.jpg`,
    };
    formData.append("files", part as unknown as Blob);
  });
  formData.append("employee_id", options.employeeId);
  formData.append("consent", "true");

  const timeoutMs = options.timeoutMs ?? FACE_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}${MOBILE_API.kiosk.registerFace}`, {
      method: "POST",
      headers: {
        "x-tablet-token": tabletToken,
        // Do NOT set Content-Type — RN sets multipart boundary.
      },
      body: formData,
      signal: controller.signal,
    });

    const text = await response.text();
    let json: { error?: string } | null = null;
    try {
      json = text ? (JSON.parse(text) as { error?: string }) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      throw new Error(
        json?.error ||
          `Could not register face (HTTP ${response.status}).`
      );
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Face service timed out after ${Math.round(timeoutMs / 1000)}s. Try again.`
      );
    }
    if (err instanceof Error && err.message) {
      throw err;
    }
    throw new Error(
      `Connection error. Cannot reach ${base}. Check network.`
    );
  } finally {
    clearTimeout(timer);
  }
}

type VerifyFaceApiResponse = {
  error?: string;
  verified?: boolean;
  confidence?: number;
  match_score?: number;
  threshold?: number;
  reason?: string | null;
  employee_id?: string;
  face_verify_token?: string;
};

/**
 * Verify face via fetch (same RN multipart path as register).
 */
export async function verifyFaceMultipart(options: {
  uri: string;
  employeeId: string;
  timeoutMs?: number;
}): Promise<{
  verified: boolean;
  confidence: number;
  match_score: number;
  threshold: number;
  reason?: string | null;
  employee_id?: string;
  face_verify_token?: string;
}> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      "App is missing EXPO_PUBLIC_API_URL. Rebuild the production APK."
    );
  }

  const tabletToken = await getTabletToken();
  if (!tabletToken) {
    throw new Error("Tablet session missing. Reconnect this tablet.");
  }

  const formData = new FormData();
  const part: RnFilePart = {
    uri: options.uri,
    type: "image/jpeg",
    name: "face_verify.jpg",
  };
  formData.append("file", part as unknown as Blob);
  formData.append("files", part as unknown as Blob);
  formData.append("employee_id", options.employeeId);

  const timeoutMs = options.timeoutMs ?? FACE_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}${MOBILE_API.kiosk.verifyFace}`, {
      method: "POST",
      headers: {
        "x-tablet-token": tabletToken,
      },
      body: formData,
      signal: controller.signal,
    });

    const text = await response.text();
    let json: VerifyFaceApiResponse | null = null;
    try {
      json = text ? (JSON.parse(text) as VerifyFaceApiResponse) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      throw new Error(
        json?.error || `Could not verify face (HTTP ${response.status}).`
      );
    }

    return {
      verified: Boolean(json?.verified),
      confidence: Number(json?.confidence ?? 0),
      match_score: Number(json?.match_score ?? json?.confidence ?? 0),
      threshold: Number(json?.threshold ?? 0),
      reason: json?.reason ?? null,
      employee_id: json?.employee_id,
      face_verify_token:
        typeof json?.face_verify_token === "string"
          ? json.face_verify_token
          : undefined,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Face service timed out after ${Math.round(timeoutMs / 1000)}s. Try again.`
      );
    }
    if (err instanceof Error && err.message) {
      if (/network request failed/i.test(err.message)) {
        throw new Error(
          `Could not reach face service at ${base}. Check network and try again.`
        );
      }
      throw err;
    }
    throw new Error(
      `Could not reach face service at ${base}. Check network and try again.`
    );
  } finally {
    clearTimeout(timer);
  }
}
