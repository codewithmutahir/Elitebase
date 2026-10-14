import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const MAX_KIOSK_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export function rejectOversizedBody(
  request: NextRequest,
  maxBytes = MAX_KIOSK_UPLOAD_BYTES
): NextResponse | null {
  const raw = request.headers.get("content-length");
  if (!raw) return null;

  const bytes = Number.parseInt(raw, 10);
  if (!Number.isFinite(bytes) || bytes <= maxBytes) return null;

  return jsonError("Request body too large.", 413);
}

export type KioskTabletContext = {
  id: string;
  company_id: string;
  location_name: string | null;
};

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function getTabletToken(request: NextRequest) {
  const header =
    request.headers.get("x-tablet-token") ??
    request.headers.get("authorization");

  if (!header) return null;

  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return header.trim();
}

export async function requireKioskTablet(
  request: NextRequest
): Promise<KioskTabletContext | NextResponse> {
  const tabletToken = getTabletToken(request);

  if (!tabletToken) {
    return jsonError("Missing tablet token.", 401);
  }

  const admin = createClient();
  const { data: tablet, error } = await admin
    .from("kiosk_tablets")
    .select(
      "id, company_id, location_name, is_active, companies ( is_active )"
    )
    .eq("tablet_token", tabletToken)
    .maybeSingle();

  if (error || !tablet) {
    return jsonError("Invalid tablet token.", 401);
  }

  if (!tablet.is_active) {
    return jsonError("This tablet has been deactivated.", 403);
  }

  const companyJoin = tablet.companies as
    | { is_active: boolean | null }
    | { is_active: boolean | null }[]
    | null;
  const companyRow = Array.isArray(companyJoin) ? companyJoin[0] : companyJoin;
  if (companyRow && companyRow.is_active === false) {
    return jsonError("This company has been suspended.", 403);
  }

  await admin
    .from("kiosk_tablets")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", tablet.id);

  return {
    id: tablet.id,
    company_id: tablet.company_id,
    location_name: tablet.location_name,
  };
}

export async function parseJsonBody<T extends Record<string, unknown>>(
  request: NextRequest
): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }
}

export function isErrorResponse(
  value: KioskTabletContext | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
