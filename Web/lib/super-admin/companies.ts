import { createClient } from "@/lib/supabase/server";
import { getAuthUserEmailsByIds } from "@/lib/auth/users";

export type SuperAdminCompanyRow = {
  id: string;
  name: string;
  ownerUid: string;
  ownerEmail: string;
  employeeCount: number;
  createdAt: string;
  isActive: boolean;
};

export async function listAllCompaniesForSuperAdmin(): Promise<
  SuperAdminCompanyRow[]
> {
  const admin = createClient();

  const { data: companies, error } = await admin
    .from("companies")
    .select("id, name, owner_uid, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error || !companies) {
    console.error("listAllCompaniesForSuperAdmin failed:", error?.message);
    return [];
  }

  if (companies.length === 0) {
    return [];
  }

  const companyIds = companies.map((c) => c.id);
  const ownerIds = companies.map((c) => c.owner_uid);
  const ownerEmails = await getAuthUserEmailsByIds(ownerIds);

  const { data: employeeRows, error: employeeError } = await admin
    .from("employees")
    .select("company_id")
    .in("company_id", companyIds);

  if (employeeError) {
    console.error("super-admin employee counts failed:", employeeError.message);
  }

  const counts = new Map<string, number>();
  for (const row of employeeRows ?? []) {
    counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
  }

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    ownerUid: company.owner_uid,
    ownerEmail: ownerEmails.get(company.owner_uid) ?? "—",
    employeeCount: counts.get(company.id) ?? 0,
    createdAt: company.created_at,
    isActive: company.is_active ?? true,
  }));
}
