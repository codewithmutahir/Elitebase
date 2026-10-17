import { unstable_cache } from "next/cache";
import { cache } from "react";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import {
  portalCompanyBenefitsTag,
  portalEmployeeBenefitsTag,
} from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";

export type BenefitCategory =
  | "health"
  | "dental"
  | "vision"
  | "retirement"
  | "pto"
  | "other";

export type BenefitEnrollmentStatus = "eligible" | "enrolled" | "waived";

export type CompanyBenefitRow = {
  id: string;
  name: string;
  description: string | null;
  category: BenefitCategory;
  is_active: boolean;
  created_at: string;
};

export type EmployeeBenefitRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  benefit_id: string;
  benefit_name: string;
  category: BenefitCategory;
  description: string | null;
  status: BenefitEnrollmentStatus;
  notes: string | null;
  enrolled_at: string | null;
  created_at: string;
};

export function formatBenefitCategory(category: BenefitCategory): string {
  switch (category) {
    case "health":
      return "Health";
    case "dental":
      return "Dental";
    case "vision":
      return "Vision";
    case "retirement":
      return "Retirement";
    case "pto":
      return "PTO";
    default:
      return "Other";
  }
}

export function formatEnrollmentStatus(status: BenefitEnrollmentStatus): string {
  switch (status) {
    case "eligible":
      return "Eligible";
    case "waived":
      return "Waived";
    default:
      return "Enrolled";
  }
}

export async function listCompanyBenefits(
  companyId: string,
  options?: { activeOnly?: boolean }
): Promise<CompanyBenefitRow[]> {
  const admin = createClient();
  let query = admin
    .from("company_benefits")
    .select("id, name, description, category, is_active, created_at")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (options?.activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) {
    console.error("listCompanyBenefits:", error.message);
    return [];
  }

  return (data ?? []) as CompanyBenefitRow[];
}

export async function listCompanyEmployeeBenefits(
  companyId: string
): Promise<EmployeeBenefitRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employee_benefits")
    .select(
      `
      id,
      employee_id,
      benefit_id,
      status,
      notes,
      enrolled_at,
      created_at,
      employees ( full_name ),
      company_benefits ( name, description, category )
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listCompanyEmployeeBenefits:", error.message);
    return [];
  }

  return ((data ?? []) as RawEmployeeBenefit[]).map(mapEmployeeBenefit);
}

async function loadEmployeeBenefitsForPortal(
  companyId: string,
  employeeId: string
): Promise<EmployeeBenefitRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employee_benefits")
    .select(
      `
      id,
      employee_id,
      benefit_id,
      status,
      notes,
      enrolled_at,
      created_at,
      employees ( full_name ),
      company_benefits ( name, description, category )
    `
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listEmployeeBenefitsForPortal:", error.message);
    return [];
  }

  return ((data ?? []) as RawEmployeeBenefit[]).map(mapEmployeeBenefit);
}

/** Portal benefits list (cached + tagged for employer/employee mutations). */
export const listEmployeeBenefitsForPortal = cache(
  async (
    companyId: string,
    employeeId: string
  ): Promise<EmployeeBenefitRow[]> =>
    unstable_cache(
      () => loadEmployeeBenefitsForPortal(companyId, employeeId),
      ["portal-employee-benefits", companyId, employeeId],
      {
        revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
        tags: [
          portalEmployeeBenefitsTag(companyId, employeeId),
          portalCompanyBenefitsTag(companyId),
        ],
      }
    )()
);

type RawEmployeeBenefit = {
  id: string;
  employee_id: string;
  benefit_id: string;
  status: BenefitEnrollmentStatus;
  notes: string | null;
  enrolled_at: string | null;
  created_at: string;
  employees: { full_name: string } | { full_name: string }[] | null;
  company_benefits:
    | { name: string; description: string | null; category: BenefitCategory }
    | { name: string; description: string | null; category: BenefitCategory }[]
    | null;
};

function mapEmployeeBenefit(row: RawEmployeeBenefit): EmployeeBenefitRow {
  const employee = Array.isArray(row.employees)
    ? row.employees[0]
    : row.employees;
  const benefit = Array.isArray(row.company_benefits)
    ? row.company_benefits[0]
    : row.company_benefits;

  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: employee?.full_name ?? "Unknown",
    benefit_id: row.benefit_id,
    benefit_name: benefit?.name ?? "Benefit",
    category: benefit?.category ?? "other",
    description: benefit?.description ?? null,
    status: row.status,
    notes: row.notes,
    enrolled_at: row.enrolled_at,
    created_at: row.created_at,
  };
}
