import { createClient } from "@/lib/supabase/server";
import type { EmployeeStatus } from "@/lib/employees/profile-queries";

export type EmployeeListItem = {
  id: string;
  full_name: string;
  email: string | null;
  department_id: string | null;
  department: string | null;
  position: string | null;
  role: string;
  status: EmployeeStatus;
  is_active: boolean;
  hasPin: boolean;
  /** Plain kiosk PIN for admin display (null for legacy rows). */
  pin: string | null;
  face_registered_at: string | null;
};

export type EmployeeDetail = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  role: string;
  department_id: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  is_active: boolean;
  status: EmployeeStatus;
  face_registered_at: string | null;
  face_consent: boolean;
  face_consent_at: string | null;
  created_at: string;
  hasPin: boolean;
  pinCreatedAt: string | null;
};

type DepartmentJoin = { name: string } | { name: string }[] | null;

function departmentName(join: DepartmentJoin): string | null {
  if (!join) return null;
  if (Array.isArray(join)) return join[0]?.name ?? null;
  return join.name ?? null;
}

function mapStatus(row: {
  status?: string | null;
  is_active?: boolean | null;
}): EmployeeStatus {
  if (row.status === "terminated" || row.status === "active") {
    return row.status;
  }
  return row.is_active ? "active" : "terminated";
}

export async function listEmployees(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, email, department_id, departments ( name ), position, role, status, is_active, face_registered_at, employee_pins ( id, pin_plain )"
    )
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listEmployees failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const pins = row.employee_pins as
      | { id: string; pin_plain: string | null }[]
      | { id: string; pin_plain: string | null }
      | null;
    const pinRow = Array.isArray(pins) ? pins[0] : pins;
    const hasPin = Boolean(pinRow?.id);

    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      department_id: row.department_id,
      department: departmentName(row.departments as DepartmentJoin),
      position: row.position,
      role: row.role,
      status: mapStatus(row),
      is_active: row.is_active,
      hasPin,
      pin: pinRow?.pin_plain ?? null,
      face_registered_at: row.face_registered_at,
    } satisfies EmployeeListItem;
  });
}

export async function getEmployeeById(companyId: string, employeeId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      `
      id, company_id, full_name, email, role, status, department_id, departments ( name ),
      position, hire_date,
      is_active, face_registered_at, face_consent, face_consent_at, created_at,
      employee_pins ( id, created_at )
    `
    )
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !data) {
    console.error("getEmployeeById failed:", error?.message);
    return null;
  }

  const pins = data.employee_pins as
    | { id: string; created_at: string }[]
    | { id: string; created_at: string }
    | null;
  const pinRow = Array.isArray(pins) ? pins[0] : pins;

  return {
    id: data.id,
    company_id: data.company_id,
    full_name: data.full_name,
    email: data.email,
    role: data.role,
    status: mapStatus(data),
    department_id: data.department_id,
    department: departmentName(data.departments as DepartmentJoin),
    position: data.position,
    hire_date: data.hire_date,
    is_active: data.is_active,
    face_registered_at: data.face_registered_at,
    face_consent: data.face_consent,
    face_consent_at: data.face_consent_at,
    created_at: data.created_at,
    hasPin: Boolean(pinRow),
    pinCreatedAt: pinRow?.created_at ?? null,
  } satisfies EmployeeDetail;
}
