import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/kiosk/api";
import { getPythonFaceServiceUrl } from "@/lib/kiosk/python-face-service";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Vercel Cron: ping face-service /warmup so Render free tier is less likely
 * to be cold at night-shift clock-in. Secured via CRON_SECRET or INTERNAL_API_KEY.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const internalKey = process.env.INTERNAL_API_KEY?.trim();
  const expected = cronSecret || internalKey;

  if (!expected || auth !== `Bearer ${expected}`) {
    return jsonError("Unauthorized", 401);
  }

  let faceServiceUrl: string;
  try {
    faceServiceUrl = getPythonFaceServiceUrl();
  } catch {
    return jsonError("Face recognition service is not configured.", 503);
  }

  const headers: Record<string, string> = {};
  if (internalKey) headers["X-Internal-Key"] = internalKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch(`${faceServiceUrl}/warmup`, {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as {
      model_loaded?: boolean;
      load_ms?: number;
      status?: string;
    };

    return jsonOk({
      ok: response.ok,
      status: response.status,
      model_loaded: body.model_loaded ?? null,
      load_ms: body.load_ms ?? null,
      service_status: body.status ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "keepalive failed";
    return jsonOk({
      ok: false,
      status: "unreachable",
      error: message,
    });
  } finally {
    clearTimeout(timer);
  }
}
