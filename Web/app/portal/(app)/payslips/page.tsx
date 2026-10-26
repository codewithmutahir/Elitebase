import { Suspense } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PayslipDocument } from "@/components/payslips/payslip-document";
import {
  PortalPayslipPrintButton,
  PortalPayslipsFilters,
} from "@/components/portal/portal-payslips-filters";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalTableSkeleton } from "@/components/portal/portal-skeletons";
import { formatMoney } from "@/lib/money/format";
import {
  formatPayslipPeriod,
  listEmployeePayslips,
  type PayslipRow,
} from "@/lib/payslips/queries";
import type { PortalEmployee } from "@/lib/portal/queries";
import { portalPanelSx } from "@/lib/portal/styles";
import { requireEmployeeSession } from "@/lib/portal/session";

export default async function PortalPayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; q?: string }>;
}) {
  const { employee } = await requireEmployeeSession();
  const filters = await searchParams;

  return (
    <Stack spacing={3} className="portal-payslips-page">
      <Box className="print:hidden portal-print-hide">
        <PortalPageHeader
          title="Payslips"
          description="Official slips published by your employer. Use Print / Save PDF for a printable copy."
        />
      </Box>

      <Suspense fallback={null}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          useFlexGap
          sx={{
            justifyContent: "space-between",
            alignItems: { sm: "flex-end" },
          }}
          className="print:hidden portal-print-hide"
        >
          <PortalPayslipsFilters />
          <PortalPayslipPrintButton />
        </Stack>
      </Suspense>

      <Suspense fallback={<PortalTableSkeleton columns={4} rows={4} />}>
        <PayslipsBody employee={employee} filters={filters} />
      </Suspense>
    </Stack>
  );
}

function applyFilters(
  rows: PayslipRow[],
  filters: { year?: string; month?: string; q?: string }
): PayslipRow[] {
  const year = filters.year ? Number(filters.year) : null;
  const month = filters.month ? Number(filters.month) : null;
  const q = filters.q?.trim().toLowerCase() ?? "";

  return rows.filter((row) => {
    if (year && row.year !== year) return false;
    if (month && row.month !== month) return false;
    if (q) {
      const hay = `${formatPayslipPeriod(row)} ${row.notes ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

async function PayslipsBody({
  employee,
  filters,
}: {
  employee: PortalEmployee;
  filters: { year?: string; month?: string; q?: string };
}) {
  const all = await listEmployeePayslips(employee.company_id, employee.id);
  const payslips = applyFilters(all, filters);
  const hasFilters = Boolean(filters.year || filters.month || filters.q);

  if (all.length === 0) {
    return (
      <PortalEmptyState
        title="No payslips yet"
        description="When your employer publishes a slip, it will show up here."
      />
    );
  }

  if (payslips.length === 0) {
    return (
      <PortalEmptyState
        title="No payslips for selected filters"
        description={
          hasFilters
            ? "Try clearing filters to see all published slips."
            : "No matching payslips."
        }
      />
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{ ...portalPanelSx, overflow: "hidden" }}
        className="print:hidden portal-print-hide"
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 520,
              "& th, & td": {
                px: 2,
                py: 1.5,
                textAlign: "left",
                fontSize: "0.875rem",
                borderBottom: "1px solid var(--eb-border)",
                whiteSpace: "nowrap",
              },
              "& th": {
                color: "var(--eb-muted)",
                fontWeight: 500,
                bgcolor: "rgba(255,255,255,0.02)",
              },
              "& td": { color: "var(--eb-text)" },
              "& tr:last-child td": { borderBottom: "none" },
            }}
          >
            <thead>
              <tr>
                <th>Period</th>
                <th>Gross</th>
                <th>Net</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payslips.map((row) => (
                <tr key={row.id}>
                  <td>{formatPayslipPeriod(row)}</td>
                  <td>
                    {row.gross_amount != null
                      ? formatMoney(
                          row.gross_amount,
                          row.currency ?? employee.company_currency
                        )
                      : "—"}
                  </td>
                  <td>
                    {row.net_amount != null
                      ? formatMoney(
                          row.net_amount,
                          row.currency ?? employee.company_currency
                        )
                      : "—"}
                  </td>
                  <td>
                    {row.file_url ? (
                      <a
                        href={row.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--eb-gold-300)] hover:underline"
                      >
                        Download file
                      </a>
                    ) : row.snapshot ? (
                      <a
                        href={`#payslip-${row.id}`}
                        className="text-[var(--eb-gold-300)] hover:underline"
                      >
                        View slip
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Box>

      {payslips
        .filter((row) => row.snapshot)
        .map((row) => (
          <Box key={row.id} id={`payslip-${row.id}`} className="payslip-print-block">
            <PayslipDocument
              data={row.snapshot!}
              meta={{
                companyName: employee.company_name,
                logoUrl: employee.company_logo_url,
                currency: row.currency ?? employee.company_currency,
                reviewedByName: row.reviewed_by_name,
                reviewedAt: row.reviewed_at,
                approvedByName: row.approved_by_name,
                approvedAt: row.approved_at,
                applyCompanyStamp: row.apply_company_stamp,
              }}
              mode="readonly"
            />
          </Box>
        ))}
    </Stack>
  );
}
