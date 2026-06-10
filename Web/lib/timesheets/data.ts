import { createClient } from "@/lib/supabase/server";
import { queryWindowIso } from "@/lib/timesheets/dates";
import {
  buildTimesheetRows,
  type AttendanceEvent,
  type TimesheetRow,
} from "@/lib/timesheets/pairing";

const DEFAULT_PAGE_SIZE = 20;

type RawAttendanceRow = {
  id: string;
  employee_id: string;
  type: string;
  timestamp: string;
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

export async function fetchAttendanceEvents(
  companyId: string,
  from: string,
  to: string
): Promise<AttendanceEvent[]> {
  const { startIso, endIso } = queryWindowIso(from, to);
  const admin = createClient();

  const { data, error } = await admin
    .from("attendance")
    .select("id, employee_id, type, timestamp, employees ( full_name )")
    .eq("company_id", companyId)
    .gte("timestamp", startIso)
    .lte("timestamp", endIso)
    .order("timestamp", { ascending: true });

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
  pageSize = DEFAULT_PAGE_SIZE
): Promise<TimesheetsResult> {
  const events = await fetchAttendanceEvents(companyId, from, to);
  const allRows = buildTimesheetRows(events, timezone, from, to);
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
  to: string
) {
  const events = await fetchAttendanceEvents(companyId, from, to);
  return buildTimesheetRows(events, timezone, from, to);
}

export { DEFAULT_PAGE_SIZE };
