import { Suspense } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PortalAttendanceTable } from "@/components/portal/portal-attendance-table";
import { PortalMonthSelect } from "@/components/portal/portal-month-select";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalMonthDataSkeleton } from "@/components/portal/portal-skeletons";
import { PortalStatCard } from "@/components/portal/portal-stat-card";
import {
  getPortalMonthSummary,
  recentMonthOptions,
  resolvePortalMonth,
} from "@/lib/portal/attendance";
import { formatPortalHours, formatPortalMonthLabel } from "@/lib/portal/format";
import type { PortalEmployee } from "@/lib/portal/queries";
import { requireEmployeeSession } from "@/lib/portal/session";
import {
  formatHourlyRate,
  formatMoney,
  formatMonthlySalary,
} from "@/lib/money/format";

export default async function PortalPayPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { employee } = await requireEmployeeSession();
  const month = resolvePortalMonth(employee.company_timezone, monthParam);
  const monthOptions = recentMonthOptions(month, 8);

  return (
    <Stack spacing={3}>
      <PortalPageHeader
        title="Pay summary"
        description={
          <>
            Estimated earnings for {formatPortalMonthLabel(month)} from your
            attendance. Official slips are under{" "}
            <Link
              href="/portal/payslips"
              className="text-[var(--eb-gold-300)] hover:underline"
            >
              Payslips
            </Link>
            .
          </>
        }
        action={
          <PortalMonthSelect
            basePath="/portal/pay"
            month={month}
            options={monthOptions}
          />
        }
      />

      <Suspense key={month} fallback={<PortalMonthDataSkeleton stats={4} columns={6} />}>
        <PayMonth employee={employee} month={month} />
      </Suspense>
    </Stack>
  );
}

async function PayMonth({
  employee,
  month,
}: {
  employee: PortalEmployee;
  month: string;
}) {
  const summary = await getPortalMonthSummary(employee, month);
  const currency = employee.company_currency;
  const rateLabel =
    employee.pay_type === "salary" && employee.salary_amount != null
      ? formatMonthlySalary(employee.salary_amount, currency)
      : employee.hourly_rate != null
        ? formatHourlyRate(employee.hourly_rate, currency)
        : "Not set";

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <PortalStatCard label="Rate" value={rateLabel} />
        <PortalStatCard
          label="Hours"
          value={formatPortalHours(summary.totalHours)}
        />
        <PortalStatCard
          label="Shift wages"
          value={formatMoney(summary.shiftWages, currency)}
        />
        <PortalStatCard
          label="Estimated total"
          value={formatMoney(summary.estimatedPay, currency)}
          hint={
            summary.bonusAmount > 0
              ? `Includes ${formatMoney(summary.bonusAmount, currency)} bonus`
              : undefined
          }
        />
      </Box>

      <PortalAttendanceTable
        rows={summary.rows}
        timezone={employee.company_timezone}
        currency={currency}
        showWages
      />
    </Stack>
  );
}
