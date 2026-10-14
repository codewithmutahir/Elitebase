import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { formatMoney } from "@/lib/money/format";
import {
  formatPayslipPeriod,
  listEmployeePayslips,
} from "@/lib/payslips/queries";
import { portalPanelSx } from "@/lib/portal/styles";
import { requireEmployeeSession } from "@/lib/portal/session";

export default async function PortalPayslipsPage() {
  const { employee } = await requireEmployeeSession();
  const payslips = await listEmployeePayslips(
    employee.company_id,
    employee.id
  );

  return (
    <Stack spacing={3}>
      <PortalPageHeader
        title="Payslips"
        description="Official slips published by your employer. For estimated earnings from attendance, see Pay."
      />

      {payslips.length === 0 ? (
        <PortalEmptyState
          title="No payslips yet"
          description="When your employer publishes a slip, it will show up here for download."
        />
      ) : (
        <Box sx={{ ...portalPanelSx, overflow: "hidden" }}>
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
                          Download
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
      )}
    </Stack>
  );
}
