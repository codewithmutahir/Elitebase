import { createClient } from "@/lib/supabase/server";

export type CompanyRow = {
  id: string;
  name: string;
  logo_url: string | null;
  timezone: string | null;
  currency: string | null;
};

export async function getCompanyByOwnerId(ownerUid: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("companies")
    .select("id, name, logo_url, timezone, currency")
    .eq("owner_uid", ownerUid)
    .maybeSingle();

  if (error) {
    console.error("Company lookup failed:", error.message);
    return null;
  }

  return data as CompanyRow | null;
}
