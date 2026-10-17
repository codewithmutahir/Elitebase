import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PortalAttendanceTable } from "@/components/portal/portal-attendance-table";
import { PortalMonthPendingFrame } from "@/components/portal/portal-pending-frame";
import { PortalMonthDataSkeleton } from "@/components/portal/portal-skeletons";
import { PortalStatCard } from "@/components/portal/portal-stat-card";
import {
  getPortalMonthSummary,
  portalMonthSelectOptions,
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
  const monthOptions = portalMonthSelectOptions(
    employee.company_timezone,
    month
  );

  return (
    <Stack spacing={3} sx={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
      <PortalMonthPendingFrame
        basePath="/portal/pay"
        month={month}
        options={monthOptions}
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
        skeleton={<PortalMonthDataSkeleton stats={4} columns={6} />}
      >
        <PayMonth employee={employee} month={month} />
      </PortalMonthPendingFrame>
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

  const totalHint = summary.isPayoutMonth
    ? `Includes ${formatMoney(summary.bonusAmount, currency)} bonus payout`
    : summary.bonusTarget > 0 && summary.nextPayoutMonth
      ? `Next bonus payout ${formatPortalMonthLabel(summary.nextPayoutMonth)}`
      : undefined;

  return (
    <Stack spacing={3} sx={{ minWidth: 0, width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          width: "100%",
          minWidth: 0,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          "& > *": { minWidth: 0 },
        }}
      >
        <PortalStatCard label="Rate" value={rateLabel} />
        <PortalStatCard
          label="Hours"
          value={formatPortalHours(summary.totalHours)}
        />
        <PortalStatCard
          label="Salary / wages"
          value={formatMoney(summary.shiftWages, currency)}
        />
        <PortalStatCard
          label="Estimated total due"
          value={formatMoney(summary.estimatedPay, currency)}
          hint={totalHint}
        />
      </Box>

      {summary.bonusTarget > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            width: "100%",
            minWidth: 0,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            "& > *": { minWidth: 0 },
          }}
        >
          <PortalStatCard
            label="Accrued bonus"
            value={formatMoney(summary.accruedBonus, currency)}
            hint={`Of ${formatMoney(summary.bonusTarget, currency)} cycle target`}
          />
          <PortalStatCard
            label="Bonus due this month"
            value={
              summary.bonusAmount > 0
                ? formatMoney(summary.bonusAmount, currency)
                : "—"
            }
            hint={
              summary.isPayoutMonth
                ? "Payout month"
                : summary.nextPayoutMonth
                  ? `Pays in ${formatPortalMonthLabel(summary.nextPayoutMonth)}`
                  : undefined
            }
          />
          <PortalStatCard
            label="Total due today"
            value={formatMoney(summary.estimatedPay, currency)}
            hint="Salary / wages + bonus due"
          />
        </Box>
      ) : null}

      <PortalAttendanceTable
        rows={summary.rows}
        timezone={employee.company_timezone}
        currency={currency}
        showWages
      />
    </Stack>
  );
}
