import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isErrorResponse,
  jsonOk,
  requireKioskTablet,
} from "@/lib/kiosk/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const admin = createClient();
  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("name, logo_url")
    .eq("id", tablet.company_id)
    .maybeSingle();

  if (companyError) {
    console.error("validate-tablet company lookup failed:", companyError.message);
  }

  return jsonOk({
    tablet_id: tablet.id,
    company_id: tablet.company_id,
    company_name: company?.name ?? "Company",
    company_logo_url: company?.logo_url ?? null,
    location_name: tablet.location_name ?? "Main Location",
  });
}
