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
  leave_sick_total_default: number;
  leave_paid_total_default: number;
  leave_year_type: "calendar" | "anniversary";
  leave_prorate_mid_year: boolean;
  lates_per_day_deduction: number;
  late_remainder_carry_month: boolean;
  late_grace_minutes: number;
};

async function fetchCompanyByOwnerId(ownerUid: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("companies")
    .select(
      "id, name, logo_url, timezone, currency, allow_remote_punch, require_geofence, is_active, leave_sick_total_default, leave_paid_total_default, leave_year_type, leave_prorate_mid_year, lates_per_day_deduction, late_remainder_carry_month, late_grace_minutes"
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

  const yearType =
    data.leave_year_type === "anniversary" ? "anniversary" : "calendar";
  const latesPer = Number(data.lates_per_day_deduction ?? 3);
  const grace = Number(data.late_grace_minutes ?? 15);

  return {
    ...data,
    allow_remote_punch: Boolean(data.allow_remote_punch),
    require_geofence: data.require_geofence !== false,
    is_active: data.is_active !== false,
    leave_sick_total_default: Number(data.leave_sick_total_default ?? 6),
    leave_paid_total_default: Number(data.leave_paid_total_default ?? 6),
    leave_year_type: yearType,
    leave_prorate_mid_year: Boolean(data.leave_prorate_mid_year),
    lates_per_day_deduction:
      Number.isFinite(latesPer) && latesPer >= 1 ? Math.trunc(latesPer) : 3,
    late_remainder_carry_month: Boolean(data.late_remainder_carry_month),
    late_grace_minutes:
      Number.isFinite(grace) && grace >= 0 && grace <= 120
        ? Math.trunc(grace)
        : 15,
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
