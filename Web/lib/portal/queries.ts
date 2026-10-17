import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import {
  normalizeBonusPolicy,
  normalizeCycleStartMonth,
  type BonusPolicy,
} from "@/lib/payroll/bonus";

export type PortalEmployee = {
  id: string;
  company_id: string;
  full_name: string;
  email: string | null;
  user_id: string;
  status: string;
  is_active: boolean;
  employment_type: string | null;
  pay_type: string | null;
  hourly_rate: number | null;
  salary_amount: number | null;
  working_days: number[];
  bonus_amount: number;
  bonus_policy: BonusPolicy;
  bonus_cycle_start_month: number;
  schedule_start_time: string | null;
  schedule_end_time: string | null;
  face_registered_at: string | null;
  company_name: string;
  company_logo_url: string | null;
  company_timezone: string;
  company_currency: string | null;
  company_allow_remote_punch: boolean;
  company_require_geofence: boolean;
  needs_reenrollment: boolean;
  has_face_descriptor: boolean;
};

async function fetchEmployeeByUserId(
  userId: string
): Promise<PortalEmployee | null> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      `
      id,
      company_id,
      full_name,
      email,
      user_id,
      status,
      is_active,
      employment_type,
      pay_type,
      hourly_rate,
      salary_amount,
      working_days,
      bonus_amount,
      bonus_policy,
      bonus_cycle_start_month,
      schedule_start_time,
      schedule_end_time,
      face_registered_at,
      needs_reenrollment,
      companies (
        name,
        logo_url,
        timezone,
        currency,
        allow_remote_punch,
        require_geofence,
        is_active
      )
    `
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("fetchEmployeeByUserId:", error.message);
    return null;
  }

  if (!data?.user_id) return null;

  const company = data.companies as
    | {
        name: string;
        logo_url: string | null;
        timezone: string | null;
        currency: string | null;
        allow_remote_punch: boolean | null;
        require_geofence: boolean | null;
        is_active: boolean | null;
      }
    | {
        name: string;
        logo_url: string | null;
        timezone: string | null;
        currency: string | null;
        allow_remote_punch: boolean | null;
        require_geofence: boolean | null;
        is_active: boolean | null;
      }[]
    | null;

  const companyRow = Array.isArray(company) ? company[0] : company;

  // Suspended companies cannot use the employee portal.
  if (companyRow && companyRow.is_active === false) {
    return null;
  }

  return {
    id: data.id,
    company_id: data.company_id,
    full_name: data.full_name,
    email: data.email,
    user_id: data.user_id,
    status: data.status,
    is_active: data.is_active,
    employment_type: data.employment_type,
    pay_type: data.pay_type,
    hourly_rate: data.hourly_rate,
    salary_amount: data.salary_amount,
    working_days: normalizeWorkingDays(
      (data.working_days as number[] | null) ?? [1, 2, 3, 4, 5]
    ),
    bonus_amount: Number(data.bonus_amount ?? 0),
    bonus_policy: normalizeBonusPolicy(data.bonus_policy),
    bonus_cycle_start_month: normalizeCycleStartMonth(
      data.bonus_cycle_start_month
    ),
    schedule_start_time: data.schedule_start_time,
    schedule_end_time: data.schedule_end_time,
    face_registered_at: data.face_registered_at,
    company_name: companyRow?.name ?? "Your company",
    company_logo_url: companyRow?.logo_url ?? null,
    company_timezone: companyRow?.timezone?.trim() || "America/New_York",
    company_currency: companyRow?.currency ?? null,
    company_allow_remote_punch: Boolean(companyRow?.allow_remote_punch),
    company_require_geofence: companyRow?.require_geofence !== false,
    needs_reenrollment: Boolean(data.needs_reenrollment),
    has_face_descriptor: Boolean(data.face_registered_at),
  };
}

export const getEmployeeByUserId = cache(fetchEmployeeByUserId);

export type PortalInviteRow = {
  id: string;
  employee_id: string;
  company_id: string;
  email: string;
  expires_at: string;
  accepted_at: string | null;
  employee_name: string;
  employee_user_id: string | null;
  employee_status: string;
  company_name: string;
};

export async function getPortalInviteByToken(
  rawToken: string
): Promise<PortalInviteRow | null> {
  const { hashPortalInviteToken } = await import("@/lib/portal/tokens");
  const tokenHash = hashPortalInviteToken(rawToken);
  const admin = createClient();

  const { data, error } = await admin
    .from("employee_portal_invites")
    .select(
      `
      id,
      employee_id,
      company_id,
      email,
      expires_at,
      accepted_at,
      employees ( full_name, user_id, status ),
      companies ( name )
    `
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("getPortalInviteByToken:", error.message);
    return null;
  }

  if (!data) return null;

  const employee = data.employees as
    | { full_name: string; user_id: string | null; status: string }
    | { full_name: string; user_id: string | null; status: string }[]
    | null;
  const employeeRow = Array.isArray(employee) ? employee[0] : employee;

  const company = data.companies as
    | { name: string }
    | { name: string }[]
    | null;
  const companyRow = Array.isArray(company) ? company[0] : company;

  if (!employeeRow) return null;

  return {
    id: data.id,
    employee_id: data.employee_id,
    company_id: data.company_id,
    email: data.email,
    expires_at: data.expires_at,
    accepted_at: data.accepted_at,
    employee_name: employeeRow.full_name,
    employee_user_id: employeeRow.user_id,
    employee_status: employeeRow.status,
    company_name: companyRow?.name ?? "Your company",
  };
}
