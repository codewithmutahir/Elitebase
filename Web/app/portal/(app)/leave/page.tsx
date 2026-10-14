import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortalLeaveForm } from "@/components/portal/portal-leave-form";
import { PortalLeaveList } from "@/components/portal/portal-leave-list";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatCard } from "@/components/portal/portal-stat-card";
import { requireEmployeeSession } from "@/lib/portal/session";
import { listEmployeeTimeOffRequests } from "@/lib/time-off/queries";

export default async function PortalLeavePage() {
  const { employee } = await requireEmployeeSession();
  const requests = await listEmployeeTimeOffRequests(
    employee.company_id,
    employee.id
  );

  const pendingCount = requests.filter((row) => row.status === "pending").length;
  const approvedCount = requests.filter(
    (row) => row.status === "approved"
  ).length;

  return (
    <Stack spacing={3}>
      <PortalPageHeader
        title="Leave"
        description="Request time off and track approval status."
      />

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
        <PortalStatCard label="Pending" value={String(pendingCount)} />
        <PortalStatCard label="Approved" value={String(approvedCount)} />
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
    </Stack>
  );
}
