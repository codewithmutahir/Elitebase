import { createClient } from "@/lib/supabase/server";
import type { WorksiteGeo } from "@/lib/worksites/geo";

export type WorksiteRow = WorksiteGeo & {
  is_active: boolean;
  created_at: string;
};

export async function listWorksites(
  companyId: string,
  options?: { activeOnly?: boolean }
): Promise<WorksiteRow[]> {
  const admin = createClient();
  let query = admin
    .from("worksites")
    .select("id, name, lat, lng, radius_meters, is_active, created_at")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listWorksites:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    radius_meters: Number(row.radius_meters),
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
  }));
}

export async function listActiveWorksitesGeo(
  companyId: string
): Promise<WorksiteGeo[]> {
  const rows = await listWorksites(companyId, { activeOnly: true });
  return rows.map(({ id, name, lat, lng, radius_meters }) => ({
    id,
    name,
    lat,
    lng,
    radius_meters,
  }));
}
