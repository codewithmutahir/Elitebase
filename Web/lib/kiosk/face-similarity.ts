import { createClient } from "@/lib/supabase/server";
import { formatDescriptorForPgvector } from "@/lib/kiosk/face";

export async function queryFaceSimilarity(
  companyId: string,
  employeeId: string,
  probe: number[]
): Promise<number | null> {
  const admin = createClient();
  const { data, error } = await admin.rpc("kiosk_face_similarity", {
    p_company_id: companyId,
    p_employee_id: employeeId,
    p_probe: formatDescriptorForPgvector(probe),
  });

  if (error) {
    console.error("kiosk_face_similarity failed:", error.message);
    return null;
  }

  if (typeof data === "number") return data;
  if (data == null) return null;
  return Number(data);
}
