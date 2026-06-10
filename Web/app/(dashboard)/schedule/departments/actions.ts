"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";

const DEPARTMENTS_PATH = "/schedule/departments";

function revalidateDepartments() {
  revalidatePath(DEPARTMENTS_PATH);
  revalidatePath("/employees");
}

export async function createDepartment(name: string, color: string) {
  const { company } = await requireCompanySession();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Department name is required." };

  const admin = createClient();
  const { data, error } = await admin
    .from("departments")
    .insert({
      company_id: company.id,
      name: trimmed,
      color: color || "#2563EB",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createDepartment failed:", error.message);
    if (error.code === "23505") {
      return { error: "A department with that name already exists." };
    }
    return { error: "Could not create department." };
  }

  revalidateDepartments();
  return { id: data.id };
}

export async function updateDepartment(
  departmentId: string,
  updates: { name?: string; color?: string }
) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const payload: { name?: string; color?: string } = {};
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) return { error: "Department name is required." };
    payload.name = trimmed;
  }
  if (updates.color !== undefined) {
    payload.color = updates.color || "#2563EB";
  }

  const { error } = await admin
    .from("departments")
    .update(payload)
    .eq("id", departmentId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateDepartment failed:", error.message);
    if (error.code === "23505") {
      return { error: "A department with that name already exists." };
    }
    return { error: "Could not update department." };
  }

  revalidateDepartments();
  return { ok: true };
}

export async function deleteDepartment(departmentId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("departments")
    .delete()
    .eq("id", departmentId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteDepartment failed:", error.message);
    return { error: "Could not delete department." };
  }

  revalidateDepartments();
  return { ok: true };
}

export async function createRole(departmentId: string, name: string) {
  const { company } = await requireCompanySession();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Role name is required." };

  const admin = createClient();
  const { data, error } = await admin
    .from("roles")
    .insert({
      company_id: company.id,
      department_id: departmentId,
      name: trimmed,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createRole failed:", error.message);
    if (error.code === "23505") {
      return { error: "That role already exists in this department." };
    }
    return { error: "Could not create role." };
  }

  revalidateDepartments();
  return { id: data.id };
}

export async function updateRole(roleId: string, name: string) {
  const { company } = await requireCompanySession();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Role name is required." };

  const admin = createClient();
  const { error } = await admin
    .from("roles")
    .update({ name: trimmed })
    .eq("id", roleId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateRole failed:", error.message);
    if (error.code === "23505") {
      return { error: "That role name already exists." };
    }
    return { error: "Could not update role." };
  }

  revalidateDepartments();
  return { ok: true };
}

export async function deleteRole(roleId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("roles")
    .delete()
    .eq("id", roleId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteRole failed:", error.message);
    return { error: "Could not delete role." };
  }

  revalidateDepartments();
  return { ok: true };
}
