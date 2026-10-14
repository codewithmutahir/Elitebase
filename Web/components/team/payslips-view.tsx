"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  createPayslip,
  deletePayslip,
} from "@/app/(dashboard)/team/payslips/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import type { EmployeeListItem } from "@/lib/employees/queries";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { formatMoney } from "@/lib/money/format";
import {
  formatPayslipPeriod,
  type PayslipRow,
} from "@/lib/payslips/queries";

type PayslipsViewProps = {
  payslips: PayslipRow[];
  employees: EmployeeListItem[];
  currency: string | null;
};

export function PayslipsView({
  payslips,
  employees,
  currency,
}: PayslipsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "active"),
    [employees]
  );

  return (
    <Stack spacing={3}>
      {success ? (
        <Typography sx={dashboardAlertSuccessSx}>{success}</Typography>
      ) : null}
      {error ? (
        <Typography sx={dashboardAlertErrorSx}>{error}</Typography>
      ) : null}

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Publish payslip
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Employees see published slips in their portal. Optional PDF/image
            upload (max 5 MB).
          </Typography>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              Add an active employee first.
            </Typography>
          ) : (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                setError(null);
                setSuccess(null);
                startTransition(async () => {
                  try {
                    const result = await createPayslip(formData);
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setSuccess("Payslip published.");
                    event.currentTarget.reset();
                    router.refresh();
                  } catch (caught) {
                    setError(getUserFacingError(caught));
                  }
                });
              }}
            >
              <Stack spacing={2}>
                <Select
                  id="employeeId"
                  name="employeeId"
                  label="Employee"
                  defaultValue={activeEmployees[0]?.id}
                  displayEmpty={false}
                  options={activeEmployees.map((employee) => ({
                    value: employee.id,
                    label: employee.full_name,
                  }))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="periodStart"
                    name="periodStart"
                    label="Period start"
                    type="date"
                    required
                  />
                  <Input
                    id="periodEnd"
                    name="periodEnd"
                    label="Period end"
                    type="date"
                    required
                  />
                </div>
                <Input
                  id="periodLabel"
                  name="periodLabel"
                  label="Label (optional)"
                  placeholder="March 2026"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="grossAmount"
                    name="grossAmount"
                    label="Gross (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <Input
                    id="netAmount"
                    name="netAmount"
                    label="Net (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Input id="notes" name="notes" label="Notes (optional)" />
                <div>
                  <label
                    htmlFor="file"
                    className="mb-1.5 block text-sm font-medium text-[var(--eb-text)]"
                  >
                    File (optional)
                  </label>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="block w-full text-sm text-[var(--eb-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--eb-accent)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                  />
                </div>
                <PendingButton
                  type="submit"
                  pending={pending}
                  pendingLabel="Publishing…"
                  className="w-fit"
                >
                  Publish payslip
                </PendingButton>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Published payslips
          </Typography>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              No payslips published yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {payslips.map((row) => (
                <Box
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--eb-border)] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--eb-text)]">
                      {row.employee_name} · {formatPayslipPeriod(row)}
                    </p>
                    <p className="text-xs text-[var(--eb-muted)]">
                      {row.net_amount != null
                        ? `Net ${formatMoney(row.net_amount, row.currency ?? currency)}`
                        : row.gross_amount != null
                          ? `Gross ${formatMoney(row.gross_amount, row.currency ?? currency)}`
                          : "No amounts"}
                      {row.file_url ? " · File attached" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {row.file_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={row.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        View
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        setSuccess(null);
                        startTransition(async () => {
                          try {
                            const result = await deletePayslip(row.id);
                            if (result.error) {
                              setError(result.error);
                              return;
                            }
                            setSuccess("Payslip deleted.");
                            router.refresh();
                          } catch (caught) {
                            setError(getUserFacingError(caught));
                          }
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
