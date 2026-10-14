import { createClient } from "@/lib/supabase/server";
import { getEmployeePerformanceStats } from "@/lib/employees/performance";
import type { EmployeePerformanceStats } from "@/lib/employees/performance";
import { createEmployeeDocumentSignedUrl } from "@/lib/storage/employee-documents";

export type EmployeeStatus = "active" | "terminated";
export type EmploymentType = "employee" | "manager" | "contractor";
export type PayType = "hourly" | "salary";
export type SalaryPeriod = "monthly";

export type EmployeeDocument = {
  id: string;
  category: "certificate" | "onboarding" | "other";
  name: string;
  file_url: string | null;
  status: "not_sent" | "sent" | "completed";
  versions: number;
  created_at: string;
};

export type EmployeeNote = {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export type EmployeeMilestone = {
  id: string;
  title: string;
  milestone_date: string;
  icon: string;
};

export type EmployeeProfile = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  department_id: string | null;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  hourly_rate: number;
  pay_type: PayType;
  salary_amount: number | null;
  salary_period: SalaryPeriod;
  working_days: number[];
  schedule_start_time: string;
  schedule_end_time: string;
  bonus_amount: number;
  bonus_note: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  terminated_at: string | null;
  termination_reason: string | null;
  is_active: boolean;
  face_registered_at: string | null;
  face_consent: boolean;
  face_consent_at: string | null;
  needs_reenrollment: boolean;
  created_at: string;
  hasPin: boolean;
  /** Always null — cleartext PINs are never stored or listed. */
  pin: string | null;
  pinCreatedAt: string | null;
  documents: EmployeeDocument[];
  notes: EmployeeNote[];
  milestones: EmployeeMilestone[];
  performance: EmployeePerformanceStats;
};

type DepartmentJoin = { name: string } | { name: string }[] | null;

function departmentName(join: DepartmentJoin): string | null {
  if (!join) return null;
  if (Array.isArray(join)) return join[0]?.name ?? null;
  return join.name ?? null;
}

export async function getEmployeeProfile(
  companyId: string,
  employeeId: string
): Promise<EmployeeProfile | null> {
  const admin = createClient();

  const { data, error } = await admin
    .from("employees")
    .select(
      `
      id, company_id, full_name, email, phone, role, employment_type, status,
      department_id, departments ( name ), position, hire_date, hourly_rate,
      pay_type, salary_amount, salary_period, working_days,
      schedule_start_time, schedule_end_time, bonus_amount, bonus_note,
      date_of_birth, emergency_contact_name, emergency_contact_phone,
      emergency_contact_relation, terminated_at, termination_reason,
      is_active, face_registered_at, face_consent, face_consent_at, needs_reenrollment, created_at,
      employee_pins ( id, created_at )
    `
    )
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !data) {
    console.error("getEmployeeProfile failed:", error?.message);
    return null;
  }

  const [documentsRes, notesRes, milestonesRes, performance] = await Promise.all([
    admin
      .from("employee_documents")
      .select("id, category, name, file_url, file_path, status, versions, created_at")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true }),
    admin
      .from("employee_notes")
      .select("id, author_id, author_name, content, created_at")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    admin
      .from("employee_milestones")
      .select("id, title, milestone_date, icon")
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .order("milestone_date", { ascending: true }),
    getEmployeePerformanceStats(companyId, employeeId),
  ]);

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
    phone: data.phone,
    role: data.role,
    employment_type: (data.employment_type ?? data.role ?? "employee") as EmploymentType,
    status: (data.status ?? (data.is_active ? "active" : "terminated")) as EmployeeStatus,
    department_id: data.department_id,
    department: departmentName(data.departments as DepartmentJoin),
    position: data.position,
    hire_date: data.hire_date,
    hourly_rate: Number(data.hourly_rate ?? 0),
    pay_type: (data.pay_type ?? "hourly") as PayType,
    salary_amount:
      data.salary_amount != null ? Number(data.salary_amount) : null,
    salary_period: (data.salary_period ?? "monthly") as SalaryPeriod,
    working_days: Array.isArray(data.working_days)
      ? (data.working_days as number[])
      : [1, 2, 3, 4, 5],
    schedule_start_time: (data.schedule_start_time as string) ?? "09:00",
    schedule_end_time: (data.schedule_end_time as string) ?? "17:00",
    bonus_amount: Number(data.bonus_amount ?? 0),
    bonus_note: (data.bonus_note as string) ?? null,
    date_of_birth: data.date_of_birth,
    emergency_contact_name: data.emergency_contact_name,
    emergency_contact_phone: data.emergency_contact_phone,
    emergency_contact_relation: data.emergency_contact_relation,
    terminated_at: data.terminated_at,
    termination_reason: data.termination_reason,
    is_active: data.is_active,
    face_registered_at: data.face_registered_at,
    face_consent: data.face_consent,
    face_consent_at: data.face_consent_at,
    needs_reenrollment: Boolean(data.needs_reenrollment),
    created_at: data.created_at,
    hasPin: Boolean(pinRow),
    pin: null,
    pinCreatedAt: pinRow?.created_at ?? null,
    documents: await Promise.all(
      ((documentsRes.data ?? []) as Array<
        EmployeeDocument & { file_path?: string | null }
      >).map(async (doc) => ({
        id: doc.id,
        category: doc.category,
        name: doc.name,
        file_url: await createEmployeeDocumentSignedUrl(
          admin,
          doc.file_path,
          doc.file_url
        ),
        status: doc.status,
        versions: doc.versions,
        created_at: doc.created_at,
      }))
    ),
    notes: (notesRes.data ?? []) as EmployeeNote[],
    milestones: (milestonesRes.data ?? []) as EmployeeMilestone[],
    performance,
  };
}
