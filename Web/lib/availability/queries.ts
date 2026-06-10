import { createClient } from "@/lib/supabase/server";

export type EmployeeAvailabilityRow = {
  id: string;
  full_name: string;
  department_id: string | null;
  department: string | null;
};

export type AvailabilitySlot = {
  id: string;
  employee_id: string;
  day_of_week: number;
  is_available: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type AvailabilityByEmployee = Record<
  string,
  Record<number, AvailabilitySlot>
>;

type DepartmentJoin = { name: string } | { name: string }[] | null;

function departmentName(join: DepartmentJoin): string | null {
  if (!join) return null;
  if (Array.isArray(join)) return join[0]?.name ?? null;
  return join.name ?? null;
}

export async function listEmployeesForAvailability(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, full_name, department_id, departments ( name )")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listEmployeesForAvailability failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    department_id: row.department_id,
    department: departmentName(row.departments as DepartmentJoin),
  })) satisfies EmployeeAvailabilityRow[];
}

export async function listAvailabilityByCompany(
  companyId: string
): Promise<AvailabilityByEmployee> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employee_availability")
    .select("id, employee_id, day_of_week, is_available, start_time, end_time")
    .eq("company_id", companyId);

  if (error) {
    console.error("listAvailabilityByCompany failed:", error.message);
    return {};
  }

  const map: AvailabilityByEmployee = {};
  for (const row of data ?? []) {
    const byDay = map[row.employee_id] ?? {};
    byDay[row.day_of_week] = {
      id: row.id,
      employee_id: row.employee_id,
      day_of_week: row.day_of_week,
      is_available: row.is_available,
      start_time: row.start_time,
      end_time: row.end_time,
    };
    map[row.employee_id] = byDay;
  }
  return map;
}
