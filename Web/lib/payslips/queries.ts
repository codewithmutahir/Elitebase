import { createClient } from "@/lib/supabase/server";
import { createEmployeeDocumentSignedUrl } from "@/lib/storage/employee-documents";

export type PayslipRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  gross_amount: number | null;
  net_amount: number | null;
  currency: string | null;
  file_url: string | null;
  notes: string | null;
  published_at: string;
  created_at: string;
};

type RawPayslip = {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  gross_amount: number | string | null;
  net_amount: number | string | null;
  currency: string | null;
  file_path: string | null;
  file_url: string | null;
  notes: string | null;
  published_at: string;
  created_at: string;
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

  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: employee?.full_name ?? "Unknown",
    period_start: row.period_start,
    period_end: row.period_end,
    period_label: row.period_label,
    gross_amount:
      row.gross_amount != null ? Number(row.gross_amount) : null,
    net_amount: row.net_amount != null ? Number(row.net_amount) : null,
    currency: row.currency,
    file_url: signedUrl,
    notes: row.notes,
    published_at: row.published_at,
    created_at: row.created_at,
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
      gross_amount,
      net_amount,
      currency,
      file_path,
      file_url,
      notes,
      published_at,
      created_at,
      employees ( full_name )
    `
    )
    .eq("company_id", companyId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("listCompanyPayslips:", error.message);
    return [];
  }

  return Promise.all(
    ((data ?? []) as RawPayslip[]).map((row) => mapPayslip(admin, row))
  );
}

export async function listEmployeePayslips(
  companyId: string,
  employeeId: string
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
      gross_amount,
      net_amount,
      currency,
      file_path,
      file_url,
      notes,
      published_at,
      created_at,
      employees ( full_name )
    `
    )
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("listEmployeePayslips:", error.message);
    return [];
  }

  return Promise.all(
    ((data ?? []) as RawPayslip[]).map((row) => mapPayslip(admin, row))
  );
}
