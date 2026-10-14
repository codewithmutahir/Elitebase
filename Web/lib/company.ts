import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CompanyRow = {
  id: string;
  name: string;
  logo_url: string | null;
  timezone: string | null;
  currency: string | null;
  allow_remote_punch: boolean;
  require_geofence: boolean;
  is_active: boolean;
};

async function fetchCompanyByOwnerId(ownerUid: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("companies")
    .select(
      "id, name, logo_url, timezone, currency, allow_remote_punch, require_geofence, is_active"
    )
    .eq("owner_uid", ownerUid)
    .maybeSingle();

  if (error) {
    console.error("Company lookup failed:", error.message);
    return null;
  }

  if (!data) return null;

  // Suspended tenants must not resolve to an active company session.
  if (data.is_active === false) return null;

  return {
    ...data,
    allow_remote_punch: Boolean(data.allow_remote_punch),
    require_geofence: data.require_geofence !== false,
    is_active: data.is_active !== false,
  } as CompanyRow;
}

/** True when owner has a company row with is_active=false. */
export async function isOwnerCompanySuspended(ownerUid: string) {
  const admin = createClient();
  const { data } = await admin
    .from("companies")
    .select("id, is_active")
    .eq("owner_uid", ownerUid)
    .maybeSingle();
  return Boolean(data && data.is_active === false);
}

/** Deduped within a single server request (layout + page). */
export const getCompanyByOwnerId = cache(fetchCompanyByOwnerId);

/** Server-only: create company row after Better Auth signup (service role). */
export async function createCompanyForOwner(
  ownerUid: string,
  name: string
): Promise<{ ok: true } | { error: string }> {
  const admin = createClient();
  const { error } = await admin.from("companies").insert({
    name,
    owner_uid: ownerUid,
  });

  if (error) {
    console.error("createCompanyForOwner failed:", error.message);
    return { error: error.message };
  }

  return { ok: true };
}
