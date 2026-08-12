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
 * Lightweight ping to wake the Render face service (cold start).
 * Safe to call on kiosk launch; does not load a face or change state.
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
  // /health is public, but send key if present for consistency.
  if (apiKey) headers["X-Internal-Key"] = apiKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${faceServiceUrl}/health`, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

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
    };

    return jsonOk({
      warmed: true,
      status: body.status ?? "ok",
      model_loaded: body.model_loaded ?? null,
      model_name: body.model_name ?? null,
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
