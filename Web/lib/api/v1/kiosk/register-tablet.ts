import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTabletToken } from "@/lib/kiosk/tablet-token";
import {
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/kiosk/api";

export const runtime = "nodejs";

type RegisterTabletBody = {
  setup_code?: string;
};

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<RegisterTabletBody>(request);

  if (body instanceof Response) {
    return body;
  }

  const setupCode = String(body.setup_code ?? "").trim().toUpperCase();
  if (!setupCode) {
    return jsonError("setup_code is required.", 400);
  }

  const admin = createClient();
  const { data: tablet, error: lookupError } = await admin
    .from("kiosk_tablets")
    .select("id, company_id, location_name, setup_code, tablet_token, is_active")
    .eq("setup_code", setupCode)
    .maybeSingle();

  if (lookupError || !tablet) {
    return jsonError("Invalid or expired setup code.", 404);
  }

  if (!tablet.is_active) {
    return jsonError("This tablet has been deactivated.", 403);
  }

  if (tablet.tablet_token) {
    return jsonError("This setup code has already been used.", 409);
  }

  const tabletToken = generateTabletToken();
  const now = new Date().toISOString();

  const { data: updatedRows, error: updateError } = await admin
    .from("kiosk_tablets")
    .update({
      tablet_token: tabletToken,
      setup_code: null,
      last_seen_at: now,
    })
    .eq("id", tablet.id)
    .is("tablet_token", null)
    .select("id");

  if (updateError) {
    console.error("register-tablet update failed:", updateError.message);
    return jsonError("Could not register tablet.", 500);
  }

  if (!updatedRows?.length) {
    // Race: another device claimed this setup code, or token already set.
    return jsonError("This setup code has already been used.", 409);
  }

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("name, logo_url")
    .eq("id", tablet.company_id)
    .maybeSingle();

  if (companyError) {
    console.error("register-tablet company lookup failed:", companyError.message);
  }

  return jsonOk({
    tablet_token: tabletToken,
    tablet_id: tablet.id,
    company_id: tablet.company_id,
    company_name: company?.name ?? "Company",
    company_logo_url: company?.logo_url ?? null,
    location_name: tablet.location_name ?? "Main Location",
  });
}
