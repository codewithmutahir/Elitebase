import { unstable_cache } from "next/cache";
import { cache } from "react";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import {
  portalCompanyLeaveTag,
  portalEmployeeLeaveTag,
} from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";

export type TimeOffRequestType = "vacation" | "sick" | "personal" | "unpaid" | "paid_leave" | "unpaid_leave";
export type TimeOffRequestStatus = "pending" | "approved" | "denied" | "cancelled";

export type TimeOffRequestRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  request_type: TimeOffRequestType;
  status: TimeOffRequestStatus;
  reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  requested_by: "employer" | "employee";
};

type RawRow = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  request_type: TimeOffRequestType;
  status: TimeOffRequestStatus;
  reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  requested_by: string;
  employees: { full_name: string } | { full_name: string }[] | null;
};

function employeeName(
  employees: RawRow["employees"]
): string {
  if (!employees) return "Unknown";
  if (Array.isArray(employees)) return employees[0]?.full_name ?? "Unknown";
  return employees.full_name ?? "Unknown";
}

function mapTimeOffRows(rows: RawRow[]): TimeOffRequestRow[] {
  return rows.map((row) => ({
    id: row.id,
    employee_id: row.employee_id,
    employee_name: employeeName(row.employees),
    start_date: row.start_date,
    end_date: row.end_date,
    request_type: row.request_type,
    status: row.status,
    reason: row.reason,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    requested_by: (row.requested_by ?? "employer") as "employer" | "employee",
  }));
}

export async function listTimeOffRequests(
  companyId: string
): Promise<TimeOffRequestRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("time_off_requests")
    .select(
      "id, employee_id, start_date, end_date, request_type, status, reason, reviewed_at, created_at, requested_by, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listTimeOffRequests failed:", error.message);
    return [];
  }

  return mapTimeOffRows((data ?? []) as RawRow[]);
}

async function loadEmployeeTimeOffRequests(
  companyId: string,
  employeeId: string
): Promise<TimeOffRequestRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("time_off_requests")
    .select(
      "id, employee_id, start_date, end_date, request_type, status, reason, reviewed_at, created_at, requested_by, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listEmployeeTimeOffRequests failed:", error.message);
    return [];
  }

  return mapTimeOffRows((data ?? []) as RawRow[]);
}

/** Employee-scoped leave history for the portal (cached + tagged). */
export const listEmployeeTimeOffRequests = cache(
  async (
    companyId: string,
    employeeId: string
  ): Promise<TimeOffRequestRow[]> =>
    unstable_cache(
      () => loadEmployeeTimeOffRequests(companyId, employeeId),
      ["portal-employee-leave", companyId, employeeId],
      {
        revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
        tags: [
          portalEmployeeLeaveTag(companyId, employeeId),
          portalCompanyLeaveTag(companyId),
        ],
      }
    )()
);

export async function listApprovedTimeOffForRange(
  companyId: string,
  from: string,
  to: string
): Promise<
  { employee_id: string; start_date: string; end_date: string }[]
> {
  const admin = createClient();
  const { data, error } = await admin
    .from("time_off_requests")
    .select("employee_id, start_date, end_date")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .lte("start_date", to)
    .gte("end_date", from);

  if (error) {
    console.error("listApprovedTimeOffForRange failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function listApprovedUnpaidLeaveForRange(
  companyId: string,
  from: string,
  to: string
): Promise<
  {
    employee_id: string;
    start_date: string;
    end_date: string;
    request_type: TimeOffRequestType;
  }[]
> {
  const admin = createClient();
  const { data, error } = await admin
    .from("time_off_requests")
    .select("employee_id, start_date, end_date, request_type")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .in("request_type", ["unpaid", "unpaid_leave"])
    .lte("start_date", to)
    .gte("end_date", from);

  if (error) {
    console.error("listApprovedUnpaidLeaveForRange failed:", error.message);
    return [];
  }

  return (data ?? []) as {
    employee_id: string;
    start_date: string;
    end_date: string;
    request_type: TimeOffRequestType;
  }[];
}

export function isDateOnApprovedTimeOff(
  date: string,
  employeeId: string,
  approved: { employee_id: string; start_date: string; end_date: string }[]
): boolean {
  return approved.some(
    (row) =>
      row.employee_id === employeeId &&
      date >= row.start_date &&
      date <= row.end_date
  );
}

export function formatTimeOffType(type: TimeOffRequestType): string {
  switch (type) {
    case "vacation":
      return "Vacation";
    case "sick":
      return "Sick";
    case "personal":
      return "Personal";
    case "unpaid":
      return "Unpaid";
    case "paid_leave":
      return "Paid Leave";
    case "unpaid_leave":
      return "Unpaid Leave";
    default:
      return type;
  }
}
