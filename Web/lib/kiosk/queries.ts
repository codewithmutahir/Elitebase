import { createClient } from "@/lib/supabase/server";

export type KioskTabletRow = {
  id: string;
  location_name: string | null;
  setup_code: string | null;
  tablet_token: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
};

export async function listKioskTablets(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("kiosk_tablets")
    .select(
      "id, location_name, setup_code, tablet_token, is_active, last_seen_at, created_at"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listKioskTablets failed:", error.message);
    return [];
  }

  return (data ?? []) as KioskTabletRow[];
}
