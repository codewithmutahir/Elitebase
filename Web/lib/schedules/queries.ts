import { createClient } from "@/lib/supabase/server";
import { shiftDurationHours } from "@/lib/schedules/format";
import { toDateParam } from "@/lib/availability/week";

export type ShiftStatus = "draft" | "published";

export type ScheduleShift = {
  id: string;
  company_id: string;
  employee_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  is_open_shift: boolean;
  notes: string | null;
  status: ShiftStatus;
  color: string;
  department_id: string | null;
  role_id: string | null;
};

import type { PayType } from "@/lib/employees/profile-queries";
import { DEFAULT_WORKING_DAYS } from "@/lib/employees/working-days";

export type ScheduleEmployeeRow = {
  id: string;
  full_name: string;
  department: string | null;
  hourly_rate: number;
  pay_type: PayType;
  salary_amount: number | null;
  working_days: number[];
};

type DepartmentJoin = { name: string } | { name: string }[] | null;

function departmentName(join: DepartmentJoin): string | null {
  if (!join) return null;
  if (Array.isArray(join)) return join[0]?.name ?? null;
  return join.name ?? null;
}

export async function listScheduleEmployees(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, departments ( name ), hourly_rate, pay_type, salary_amount, working_days"
    )
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listScheduleEmployees failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    department: departmentName(row.departments as DepartmentJoin),
    hourly_rate: Number(row.hourly_rate ?? 0),
    pay_type: (row.pay_type ?? "hourly") as PayType,
    salary_amount:
      row.salary_amount != null ? Number(row.salary_amount) : null,
    working_days: Array.isArray(row.working_days)
      ? (row.working_days as number[])
      : [...DEFAULT_WORKING_DAYS],
  })) satisfies ScheduleEmployeeRow[];
}

export async function listShiftsForWeek(
  companyId: string,
  weekMonday: Date
) {
  const monday = new Date(weekMonday);
  const sunday = new Date(weekMonday);
  sunday.setDate(sunday.getDate() + 6);

  const startDate = toDateParam(monday);
  const endDate = toDateParam(sunday);

  const admin = createClient();
  const { data, error } = await admin
    .from("schedules")
    .select(
      "id, company_id, employee_id, shift_date, start_time, end_time, is_open_shift, notes, status, color, department_id, role_id"
    )
    .eq("company_id", companyId)
    .gte("shift_date", startDate)
    .lte("shift_date", endDate)
    .order("shift_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("listShiftsForWeek failed:", error.message);
    return [];
  }

  return (data ?? []) as ScheduleShift[];
}

export function groupShifts(shifts: ScheduleShift[]) {
  const openByDate: Record<string, ScheduleShift[]> = {};
  const byEmployeeDate: Record<string, Record<string, ScheduleShift[]>> = {};

  for (const shift of shifts) {
    if (shift.is_open_shift || !shift.employee_id) {
      const list = openByDate[shift.shift_date] ?? [];
      list.push(shift);
      openByDate[shift.shift_date] = list;
      continue;
    }

    const byDate = byEmployeeDate[shift.employee_id] ?? {};
    const list = byDate[shift.shift_date] ?? [];
    list.push(shift);
    byDate[shift.shift_date] = list;
    byEmployeeDate[shift.employee_id] = byDate;
  }

  return { openByDate, byEmployeeDate };
}

export function employeeWeekTotals(
  shifts: ScheduleShift[],
  employeeId: string
): { hours: number; wages: number } {
  let hours = 0;
  for (const shift of shifts) {
    if (shift.employee_id !== employeeId) continue;
    hours += shiftDurationHours(shift.start_time, shift.end_time);
  }
  return { hours, wages: 0 };
}

export function dayTotals(
  shifts: ScheduleShift[],
  shiftDate: string
): { hours: number; wages: number } {
  let hours = 0;
  for (const shift of shifts) {
    if (shift.shift_date !== shiftDate) continue;
    if (shift.is_open_shift || !shift.employee_id) continue;
    hours += shiftDurationHours(shift.start_time, shift.end_time);
  }
  return { hours, wages: 0 };
}
