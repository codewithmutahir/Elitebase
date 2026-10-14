"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";
import type {
  BenefitCategory,
  BenefitEnrollmentStatus,
} from "@/lib/benefits/queries";

const CATEGORIES: BenefitCategory[] = [
  "health",
  "dental",
  "vision",
  "retirement",
  "pto",
  "other",
];

const STATUSES: BenefitEnrollmentStatus[] = [
  "eligible",
  "enrolled",
  "waived",
];

function revalidateBenefits() {
  revalidatePath("/team/benefits");
  revalidatePath("/portal/benefits");
}

export async function createCompanyBenefit(formData: FormData) {
  const { company } = await requireCompanySession();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "other").trim() as BenefitCategory;

  if (!name) return { error: "Benefit name is required." };
  if (!CATEGORIES.includes(category)) return { error: "Invalid category." };

  const admin = createClient();
  const { error } = await admin.from("company_benefits").insert({
    company_id: company.id,
    name,
    description,
    category,
    is_active: true,
  });

  if (error) {
    console.error("createCompanyBenefit:", error.message);
    return { error: "Could not create benefit." };
  }

  revalidateBenefits();
  return { ok: true as const };
}

export async function setCompanyBenefitActive(
  benefitId: string,
  isActive: boolean
) {
  const { company } = await requireCompanySession();
  const admin = createClient();
  const { error } = await admin
    .from("company_benefits")
    .update({ is_active: isActive })
    .eq("id", benefitId)
    .eq("company_id", company.id);

  if (error) {
    console.error("setCompanyBenefitActive:", error.message);
    return { error: "Could not update benefit." };
  }

  revalidateBenefits();
  return { ok: true as const };
}

export async function assignEmployeeBenefit(formData: FormData) {
  const { company } = await requireCompanySession();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const benefitId = String(formData.get("benefitId") ?? "").trim();
  const status = String(formData.get("status") ?? "enrolled").trim() as BenefitEnrollmentStatus;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!employeeId || !benefitId) {
    return { error: "Employee and benefit are required." };
  }
  if (!STATUSES.includes(status)) return { error: "Invalid status." };

  const admin = createClient();

  const [{ data: employee }, { data: benefit }] = await Promise.all([
    admin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("company_id", company.id)
      .maybeSingle(),
    admin
      .from("company_benefits")
      .select("id")
      .eq("id", benefitId)
      .eq("company_id", company.id)
      .maybeSingle(),
  ]);

  if (!employee) return { error: "Employee not found." };
  if (!benefit) return { error: "Benefit not found." };

  const { error } = await admin.from("employee_benefits").upsert(
    {
      company_id: company.id,
      employee_id: employeeId,
      benefit_id: benefitId,
      status,
      notes,
      enrolled_at: status === "enrolled" ? new Date().toISOString() : null,
    },
    { onConflict: "employee_id,benefit_id" }
  );

  if (error) {
    console.error("assignEmployeeBenefit:", error.message);
    return { error: "Could not assign benefit." };
  }

  revalidateBenefits();
  return { ok: true as const };
}

export async function removeEmployeeBenefit(assignmentId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();
  const { error } = await admin
    .from("employee_benefits")
    .delete()
    .eq("id", assignmentId)
    .eq("company_id", company.id);

  if (error) {
    console.error("removeEmployeeBenefit:", error.message);
    return { error: "Could not remove assignment." };
  }

  revalidateBenefits();
  return { ok: true as const };
}
