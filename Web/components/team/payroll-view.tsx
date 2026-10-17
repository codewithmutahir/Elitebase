"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { muiAlpha } from "@/lib/mui/alpha";
import { formatMoney } from "@/lib/money/format";
import { policyMonths } from "@/lib/payroll/bonus";
import type {
  PayrollEmployeeOption,
  PayrollYearBreakdown,
} from "@/lib/payroll/queries";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type PayrollViewProps = {
  employees: PayrollEmployeeOption[];
  breakdown: PayrollYearBreakdown | null;
  selectedEmployeeId: string | null;
  year: number;
  yearOptions: number[];
  currency: string | null;
};

function monthLabel(yearMonth: string): string {
  const month = Number(yearMonth.slice(5, 7));
  return MONTH_LABELS[month - 1] ?? yearMonth;
}

export function PayrollView({
  employees,
  breakdown,
  selectedEmployeeId,
  year,
  yearOptions,
  currency,
}: PayrollViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const [pending, startTransition] = useTransition();
  const payoutRowBg = muiAlpha(theme, (p) => p.primary.main, 0.08);

  const cycleStartLabel = useMemo(() => {
    if (!breakdown) return "";
    const month = breakdown.employee.bonus_cycle_start_month;
    return MONTH_LABELS[month - 1] ?? String(month);
  }, [breakdown]);

  function navigate(next: { employeeId?: string; year?: number }) {
    const params = new URLSearchParams();
    const employeeId = next.employeeId ?? selectedEmployeeId;
    const nextYear = next.year ?? year;
    if (employeeId) params.set("employeeId", employeeId);
    params.set("year", String(nextYear));
    startTransition(() => {
      router.push(`/team/payroll?${params.toString()}`);
    });
  }

  if (employees.length === 0) {
    return (
      <Card sx={dashboardCardSx}>
        <CardContent>
          <Typography sx={dashboardPageIntroSx}>
            Add an active employee to review salary and bonus due by month.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={3} sx={{ opacity: pending ? 0.7 : 1 }}>
      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Payroll
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Month-by-month salary pay and bonus accrual. Bonus cash is due only
            on the last month of each policy cycle.
          </Typography>
        </CardHeader>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(0, 1fr) minmax(0, 180px)",
              },
            }}
          >
            <Select
              label="Employee"
              value={selectedEmployeeId ?? ""}
              displayEmpty={false}
              onChange={(event) =>
                navigate({ employeeId: event.target.value })
              }
              options={employees.map((employee) => ({
                value: employee.id,
                label: employee.full_name,
              }))}
            />
            <Select
              label="Year"
              value={String(year)}
              displayEmpty={false}
              onChange={(event) =>
                navigate({ year: Number(event.target.value) })
              }
              options={yearOptions.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
            />
          </Box>
        </CardContent>
      </Card>

      {breakdown ? (
        <Card sx={dashboardCardSx}>
          <CardHeader>
            <Typography component="h2" sx={dashboardSectionTitleSx}>
              {breakdown.employee.full_name}
            </Typography>
            <Typography sx={dashboardPageIntroSx}>
              Bonus {formatMoney(breakdown.employee.bonus_amount, currency)}
              {" · "}
              {breakdown.policyLabel}
              {" · cycle starts "}
              {cycleStartLabel}
            </Typography>
          </CardHeader>
          <CardContent>
            {breakdown.employee.bonus_amount <= 0 ? (
              <Typography sx={dashboardPageIntroSx}>
                No bonus configured. Set amount and policy on the employee Job
                Details tab.
              </Typography>
            ) : null}

            <Box
              sx={{
                mt: breakdown.employee.bonus_amount <= 0 ? 2 : 0,
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 640,
                  borderCollapse: "collapse",
                  "& th, & td": {
                    px: 1.5,
                    py: 1.25,
                    textAlign: "left",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    fontSize: "0.875rem",
                  },
                  "& th": {
                    color: "text.secondary",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  },
                  "& td": {
                    color: "text.primary",
                    fontVariantNumeric: "tabular-nums",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Cycle</th>
                    <th>Salary pay</th>
                    <th>Accrued bonus</th>
                    <th>Bonus due</th>
                    <th>Total due</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.months.map((row) => (
                    <tr
                      key={row.yearMonth}
                      style={
                        row.isPayoutMonth
                          ? { background: payoutRowBg }
                          : undefined
                      }
                    >
                      <td>
                        {monthLabel(row.yearMonth)}
                        {row.isPayoutMonth ? " · payout" : ""}
                      </td>
                      <td>
                        {row.monthInCycle}/
                        {policyMonths(breakdown.employee.bonus_policy)}
                      </td>
                      <td>{formatMoney(row.salaryPay, currency)}</td>
                      <td>{formatMoney(row.accruedBalance, currency)}</td>
                      <td>
                        {row.bonusDue > 0
                          ? formatMoney(row.bonusDue, currency)
                          : "—"}
                      </td>
                      <td>{formatMoney(row.totalDue, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}
