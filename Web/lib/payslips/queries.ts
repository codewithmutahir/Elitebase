import { unstable_cache } from "next/cache";
import { cache } from "react";
import { REFERENCE_DATA_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import {
  portalCompanyPayslipsTag,
  portalEmployeePayslipsTag,
} from "@/lib/cache/tags";
import { createClient } from "@/lib/supabase/server";
import { createEmployeeDocumentSignedUrl } from "@/lib/storage/employee-documents";
import type { CalculatePayslipResult } from "@/lib/payslips/calculate";
import type { PayslipStatus } from "@/lib/payslips/status";

export type PayslipRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  year: number | null;
  month: number | null;
  status: PayslipStatus;
  version: number;
  revision_note: string | null;
  supersedes_id: string | null;
  gross_amount: number | null;
  net_amount: number | null;
  currency: string | null;
  file_url: string | null;
  notes: string | null;
  published_at: string | null;
  created_at: string;
  apply_company_stamp: boolean;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  snapshot: CalculatePayslipResult | null;
};

type RawPayslip = {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  year: number | null;
  month: number | null;
  status: string | null;
  version: number | null;
  revision_note: string | null;
  supersedes_id: string | null;
  gross_amount: number | string | null;
  net_amount: number | string | null;
  currency: string | null;
  file_path: string | null;
  file_url: string | null;
  notes: string | null;
  published_at: string | null;
  created_at: string;
  apply_company_stamp: boolean | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  snapshot: CalculatePayslipResult | null;
  employees: { full_name: string } | { full_name: string }[] | null;
};

async function mapPayslip(
  admin: ReturnType<typeof createClient>,
  row: RawPayslip
): Promise<PayslipRow> {
  const employee = Array.isArray(row.employees)
    ? row.employees[0]
    : row.employees;

  const signedUrl = await createEmployeeDocumentSignedUrl(
    admin,
    row.file_path,
    row.file_url
  );

  const status = (row.status ?? "published") as PayslipStatus;

  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: employee?.full_name ?? "Unknown",
    period_start: row.period_start,
    period_end: row.period_end,
    period_label: row.period_label,
    year: row.year != null ? Number(row.year) : null,
    month: row.month != null ? Number(row.month) : null,
    status,
    version: Number(row.version ?? 1),
    revision_note: row.revision_note ?? null,
    supersedes_id: row.supersedes_id ?? null,
    gross_amount:
      row.gross_amount != null ? Number(row.gross_amount) : null,
    net_amount: row.net_amount != null ? Number(row.net_amount) : null,
    currency: row.currency,
    file_url: signedUrl,
    notes: row.notes,
    published_at: row.published_at,
    created_at: row.created_at,
    apply_company_stamp: Boolean(row.apply_company_stamp),
    reviewed_by_name: row.reviewed_by_name,
    reviewed_at: row.reviewed_at,
    approved_by_name: row.approved_by_name,
    approved_at: row.approved_at,
    snapshot: row.snapshot ?? null,
  };
}

export function formatPayslipPeriod(row: PayslipRow): string {
  if (row.period_label?.trim()) return row.period_label.trim();
  if (row.period_start === row.period_end) return row.period_start;
  return `${row.period_start} – ${row.period_end}`;
}

export async function listCompanyPayslips(
  companyId: string
): Promise<PayslipRow[]> {
  const admin = createClient();
  const { data, error } = await admin
    .from("payslips")
    .select(
      `
      id,
      employee_id,
      period_start,
      period_end,
      period_label,
      year,
      month,
      status,
      version,
      revision_note,
      supersedes_id,
      gross_amount,
      net_amount,
      currency,
      file_path,
      file_url,
      notes,
      published_at,
      created_at,
      apply_company_stamp,
      reviewed_by_name,
      reviewed_at,
      approved_by_name,
      approved_at,
      snapshot,
      employees ( full_name )
    `
    )
    .eq("company_id", companyId)
    .is("replaced_by_id", null)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error) {
    console.error("listCompanyPayslips:", error.message);
    return [];
  }

  return Promise.all(
    ((data ?? []) as RawPayslip[]).map((row) => mapPayslip(admin, row))
  );
}

async function loadEmployeePayslips(
  companyId: string,
  employeeId: string
): Promise<PayslipRow[]> {
  const admin = createClient();
  // Include published rows even if a draft revision replaced them as the tip,
  // so employees keep seeing the last published slip until the revision ships.
  const { data, error } = await admin
    .from("payslips")
    .select(
      `
      id,
      employee_id,
      period_start,
      period_end,
      period_label,
      year,
      month,
      status,
      version,
      revision_note,
      supersedes_id,
      gross_amount,
      net_amount,
      currency,
      file_path,
      file_url,
      notes,
      published_at,
      created_at,
      apply_company_stamp,
      reviewed_by_name,
      reviewed_at,
      approved_by_name,
      approved_at,
      snapshot,
      employees ( full_name )
    `
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("status", "published")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("version", { ascending: false });

  if (error) {
    console.error("listEmployeePayslips:", error.message);
    return [];
  }

  const mapped = await Promise.all(
    ((data ?? []) as RawPayslip[]).map((row) => mapPayslip(admin, row))
  );

  // One published slip per year/month (highest version wins).
  const seen = new Set<string>();
  const latest: PayslipRow[] = [];
  for (const row of mapped) {
    const key = `${row.year ?? row.period_start.slice(0, 4)}-${row.month ?? row.period_start.slice(5, 7)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push(row);
  }
  return latest;
}

/** Portal payslips (cached + tagged; signed URLs refresh within TTL). */
export const listEmployeePayslips = cache(
  async (companyId: string, employeeId: string): Promise<PayslipRow[]> =>
    unstable_cache(
      () => loadEmployeePayslips(companyId, employeeId),
      ["portal-employee-payslips", companyId, employeeId],
      {
        revalidate: REFERENCE_DATA_REVALIDATE_SECONDS,
        tags: [
          portalEmployeePayslipsTag(companyId, employeeId),
          portalCompanyPayslipsTag(companyId),
        ],
      }
    )()
);
