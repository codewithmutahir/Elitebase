import { unstable_cache } from "next/cache";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import {
  companyAttendanceMonthsTag,
  companyEmployeeListsTag,
} from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";
import { queryWindowIso } from "@/lib/timesheets/dates";
import {
  buildTimesheetRows,
  type AttendanceEvent,
  type TimesheetRow,
} from "@/lib/timesheets/pairing";
import { mergeTimesheetRowsWithScheduledAbsences } from "@/lib/timesheets/scheduled-absent";

const DEFAULT_PAGE_SIZE = 20;

type RawAttendanceRow = {
  id: string;
  employee_id: string;
  type: string;
  timestamp: string;
  attendance_status: string | null;
  review_flag: string | null;
  employees: { full_name: string } | { full_name: string }[] | null;
};

function employeeName(
  employees: RawAttendanceRow["employees"]
): string {
  if (!employees) return "Unknown";
  if (Array.isArray(employees)) {
    return employees[0]?.full_name ?? "Unknown";
  }
  return employees.full_name ?? "Unknown";
}

export async function validateEmployeeForCompany(
  companyId: string,
  employeeId: string
): Promise<boolean> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.error("validateEmployeeForCompany failed:", error.message);
    return false;
  }

  return Boolean(data);
}

async function loadAttendanceMonths(
  companyId: string,
  timezone: string,
  limit: number
): Promise<string[]> {
  const admin = createClient();
  const { data, error } = await admin.rpc("get_attendance_months", {
    p_company_id: companyId,
    p_timezone: timezone,
    p_limit: limit,
  });

  if (error) {
    console.error("listAttendanceMonths failed:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row: { month: string }) => row.month)
    .filter((month: string) => /^\d{4}-\d{2}$/.test(month));
}

/** Shared by timesheets page and `/api/v1/timesheets/months` (HTTP cache on API). */
export async function listAttendanceMonths(
  companyId: string,
  timezone: string,
  limit = 24
): Promise<string[]> {
  return unstable_cache(
    () => loadAttendanceMonths(companyId, timezone, limit),
    ["attendance-months", companyId, timezone, String(limit)],
    {
      revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
      tags: [companyAttendanceMonthsTag(companyId)],
    }
  )();
}

export async function fetchAttendanceEvents(
  companyId: string,
  from: string,
  to: string,
  employeeId?: string
): Promise<AttendanceEvent[]> {
  const { startIso, endIso } = queryWindowIso(from, to);
  const admin = createClient();

  let query = admin
    .from("attendance")
    .select(
      "id, employee_id, type, timestamp, attendance_status, review_flag, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .is("voided_at", null)
    .gte("timestamp", startIso)
    .lte("timestamp", endIso);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query.order("timestamp", { ascending: true });

  if (error) {
    console.error("fetchAttendanceEvents failed:", error.message);
    return [];
  }

  return ((data ?? []) as RawAttendanceRow[]).map((row) => ({
    id: row.id,
    employee_id: row.employee_id,
    employee_name: employeeName(row.employees),
    type: row.type,
    timestamp: row.timestamp,
    attendance_status:
      row.type === "clock_in" ? row.attendance_status ?? null : null,
    review_flag: row.review_flag ?? null,
  }));
}

export type TimesheetsResult = {
  rows: TimesheetRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getTimesheetsPage(
  companyId: string,
  timezone: string,
  from: string,
  to: string,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
  employeeId?: string
): Promise<TimesheetsResult> {
  const events = await fetchAttendanceEvents(
    companyId,
    from,
    to,
    employeeId
  );
  const baseRows = buildTimesheetRows(events, timezone, from, to);
  const allRows = await mergeTimesheetRowsWithScheduledAbsences(
    companyId,
    from,
    to,
    baseRows,
    employeeId
  );
  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = allRows.slice(start, start + pageSize);

  return {
    rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getAllTimesheetRows(
  companyId: string,
  timezone: string,
  from: string,
  to: string,
  employeeId?: string
) {
  const events = await fetchAttendanceEvents(companyId, from, to, employeeId);
  const baseRows = buildTimesheetRows(events, timezone, from, to);
  return mergeTimesheetRowsWithScheduledAbsences(
    companyId,
    from,
    to,
    baseRows,
    employeeId
  );
}

export type TimesheetEmployeeOption = {
  id: string;
  full_name: string;
};

async function loadTimesheetEmployeeOptions(
  companyId: string
): Promise<TimesheetEmployeeOption[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("listTimesheetEmployeeOptions failed:", error.message);
    return [];
  }

  return (data ?? []) as TimesheetEmployeeOption[];
}

export async function listTimesheetEmployeeOptions(
  companyId: string
): Promise<TimesheetEmployeeOption[]> {
  return unstable_cache(
    () => loadTimesheetEmployeeOptions(companyId),
    ["timesheet-employee-options", companyId],
    {
      revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
      tags: [companyEmployeeListsTag(companyId)],
    }
  )();
}

export { DEFAULT_PAGE_SIZE };
