import { Suspense } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortalLeaveForm } from "@/components/portal/portal-leave-form";
import { PortalLeaveList } from "@/components/portal/portal-leave-list";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import {
  PortalStatGridSkeleton,
  PortalTableSkeleton,
} from "@/components/portal/portal-skeletons";
import { PortalStatCard } from "@/components/portal/portal-stat-card";
import { createClient } from "@/lib/supabase/server";
import { leaveYearForDate, parseLeavePolicy } from "@/lib/leave-balance/policy";
import { getCachedEmployeeLeaveBalance } from "@/lib/leave-balance/queries";
import type { PortalEmployee } from "@/lib/portal/queries";
import { requireEmployeeSession } from "@/lib/portal/session";
import { listEmployeeTimeOffRequests } from "@/lib/time-off/queries";

export default async function PortalLeavePage() {
  const { employee } = await requireEmployeeSession();

  return (
    <Stack spacing={3}>
      <PortalPageHeader
        title="Leave"
        description="Request time off, track approval status, and see your leave balance."
      />

      <Suspense
        fallback={
          <Stack spacing={3}>
            <PortalStatGridSkeleton count={3} />
            <PortalTableSkeleton columns={4} rows={3} />
          </Stack>
        }
      >
        <LeaveBody employee={employee} />
      </Suspense>
    </Stack>
  );
}

async function LeaveBody({ employee }: { employee: PortalEmployee }) {
  const admin = createClient();
  const { data: companyRow } = await admin
    .from("companies")
    .select(
      "leave_year_type, leave_sick_total_default, leave_paid_total_default, leave_prorate_mid_year"
    )
    .eq("id", employee.company_id)
    .maybeSingle();

  const policy = parseLeavePolicy(companyRow);
  const today = new Date().toISOString().slice(0, 10);
  const leaveYear = leaveYearForDate(
    today,
    employee.hire_date ?? null,
    policy.yearType
  );

  const [requests, balance] = await Promise.all([
    listEmployeeTimeOffRequests(employee.company_id, employee.id),
    getCachedEmployeeLeaveBalance(
      employee.company_id,
      employee.id,
      leaveYear
    ),
  ]);

  const pendingCount = requests.filter((row) => row.status === "pending").length;
  const approvedCount = requests.filter(
    (row) => row.status === "approved"
  ).length;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <PortalStatCard
          label={`Sick (${leaveYear})`}
          value={
            balance
              ? `${balance.sickRemaining}/${balance.sickTotal}`
              : "—"
          }
        />
        <PortalStatCard
          label={`Paid (${leaveYear})`}
          value={
            balance
              ? `${balance.paidRemaining}/${balance.paidTotal}`
              : "—"
          }
        />
        <PortalStatCard
          label={`Total remaining`}
          value={
            balance
              ? `${balance.totalRemaining}/${balance.totalAllotted}`
              : "—"
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        <PortalStatCard label="Pending requests" value={String(pendingCount)} />
        <PortalStatCard
          label="Approved requests"
          value={String(approvedCount)}
        />
      </Box>

      <PortalLeaveForm />

      <Box>
        <Typography
          sx={{
            mb: 1.5,
            fontWeight: 560,
            color: "var(--eb-text)",
          }}
        >
          Your requests
        </Typography>
        <PortalLeaveList requests={requests} />
      </Box>
    </>
  );
}
