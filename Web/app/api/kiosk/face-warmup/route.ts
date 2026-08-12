import { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { getPythonFaceServiceUrl } from "@/lib/kiosk/python-face-service";

export const runtime = "nodejs";

/**
 * Wake the Render face service and load InsightFace into memory.
 * Safe to call on kiosk launch / Idle focus.
 */
export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  let faceServiceUrl: string;
  try {
    faceServiceUrl = getPythonFaceServiceUrl();
  } catch {
    return jsonError("Face recognition service is not configured.", 503);
  }

  const headers: Record<string, string> = {};
  const apiKey = process.env.INTERNAL_API_KEY?.trim();
  if (apiKey) headers["X-Internal-Key"] = apiKey;

  const controller = new AbortController();
  // Model download/load on cold start can take a while on free tier.
  const timer = setTimeout(() => controller.abort(), 90_000);

  try {
    // Prefer /warmup (loads model). Fall back to /health if older deploy.
    let response = await fetch(`${faceServiceUrl}/warmup`, {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 404 || response.status === 405) {
      response = await fetch(`${faceServiceUrl}/health`, {
        method: "GET",
        headers,
        signal: controller.signal,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      return jsonOk({
        warmed: false,
        status: response.status,
        model_loaded: null,
      });
    }

    const body = (await response.json()) as {
      status?: string;
      model_loaded?: boolean;
      model_name?: string;
      load_ms?: number;
    };

    return jsonOk({
      warmed: true,
      status: body.status ?? "ok",
      model_loaded: body.model_loaded ?? null,
      model_name: body.model_name ?? null,
      load_ms: body.load_ms ?? null,
    });
  } catch {
    return jsonOk({
      warmed: false,
      status: "unreachable",
      model_loaded: null,
    });
  } finally {
    clearTimeout(timer);
  }
}
