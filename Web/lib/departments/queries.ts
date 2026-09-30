import { unstable_cache } from "next/cache";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { companyDepartmentsTag } from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";

export type JobRole = {
  id: string;
  name: string;
  department_id: string | null;
};

export type DepartmentWithRoles = {
  id: string;
  name: string;
  color: string;
  roles: JobRole[];
};

export type DepartmentOption = {
  id: string;
  name: string;
  color: string;
};

async function loadDepartmentsWithRoles(companyId: string) {
  const admin = createClient();

  const { data: departments, error: deptError } = await admin
    .from("departments")
    .select("id, name, color")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (deptError) {
    console.error("listDepartmentsWithRoles departments:", deptError.message);
    return [];
  }

  const { data: roles, error: rolesError } = await admin
    .from("roles")
    .select("id, name, department_id")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (rolesError) {
    console.error("listDepartmentsWithRoles roles:", rolesError.message);
  }

  const rolesByDept = new Map<string, JobRole[]>();
  for (const role of roles ?? []) {
    if (!role.department_id) continue;
    const list = rolesByDept.get(role.department_id) ?? [];
    list.push({
      id: role.id,
      name: role.name,
      department_id: role.department_id,
    });
    rolesByDept.set(role.department_id, list);
  }

  return (departments ?? []).map((dept) => ({
    id: dept.id,
    name: dept.name,
    color: dept.color,
    roles: rolesByDept.get(dept.id) ?? [],
  })) satisfies DepartmentWithRoles[];
}

async function loadDepartmentOptions(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("departments")
    .select("id, name, color")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) {
    console.error("listDepartmentOptions failed:", error.message);
    return [];
  }

  return (data ?? []) as DepartmentOption[];
}

export async function listDepartmentsWithRoles(companyId: string) {
  return unstable_cache(
    () => loadDepartmentsWithRoles(companyId),
    ["departments-with-roles", companyId],
    {
      revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
      tags: [companyDepartmentsTag(companyId)],
    }
  )();
}

export async function listDepartmentOptions(companyId: string) {
  return unstable_cache(
    () => loadDepartmentOptions(companyId),
    ["department-options", companyId],
    {
      revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
      tags: [companyDepartmentsTag(companyId)],
    }
  )();
}
