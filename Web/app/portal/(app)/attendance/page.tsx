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

export default async function PortalAttendancePage({
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
        basePath="/portal/attendance"
        month={month}
        options={monthOptions}
        title="Attendance"
        description={`Your punches for ${formatPortalMonthLabel(month)}.`}
        skeleton={<PortalMonthDataSkeleton stats={4} columns={5} />}
      >
        <AttendanceMonth employee={employee} month={month} />
      </PortalMonthPendingFrame>
    </Stack>
  );
}

async function AttendanceMonth({
  employee,
  month,
}: {
  employee: PortalEmployee;
  month: string;
}) {
  const summary = await getPortalMonthSummary(employee, month);

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
        <PortalStatCard
          label="Hours"
          value={formatPortalHours(summary.totalHours)}
        />
        <PortalStatCard
          label="Complete shifts"
          value={String(summary.completeShifts)}
        />
        <PortalStatCard label="Late" value={String(summary.lateShifts)} />
        <PortalStatCard label="Absent" value={String(summary.absentDays)} />
      </Box>

      <PortalAttendanceTable
        rows={summary.rows}
        timezone={employee.company_timezone}
        currency={employee.company_currency}
      />
    </Stack>
  );
}
