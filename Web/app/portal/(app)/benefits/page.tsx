import { Suspense } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalBenefitListSkeleton } from "@/components/portal/portal-skeletons";
import {
  formatBenefitCategory,
  formatEnrollmentStatus,
  listEmployeeBenefitsForPortal,
} from "@/lib/benefits/queries";
import type { PortalEmployee } from "@/lib/portal/queries";
import { portalPanelSx } from "@/lib/portal/styles";
import { requireEmployeeSession } from "@/lib/portal/session";

export default async function PortalBenefitsPage() {
  const { employee } = await requireEmployeeSession();

  return (
    <Stack spacing={3}>
      <PortalPageHeader
        title="Benefits"
        description="Coverage your employer has assigned to you."
      />

      <Suspense fallback={<PortalBenefitListSkeleton />}>
        <BenefitsBody employee={employee} />
      </Suspense>
    </Stack>
  );
}

async function BenefitsBody({ employee }: { employee: PortalEmployee }) {
  const benefits = await listEmployeeBenefitsForPortal(
    employee.company_id,
    employee.id
  );

  if (benefits.length === 0) {
    return (
      <PortalEmptyState
        title="No benefits yet"
        description="Check back after your manager enrolls you in a plan."
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      {benefits.map((row) => (
        <Box
          key={row.id}
          sx={{
            ...portalPanelSx,
            px: 2.25,
            py: 2,
          }}
        >
          <Typography sx={{ fontWeight: 560, color: "var(--eb-text)" }}>
            {row.benefit_name}
          </Typography>
          <Typography
            sx={{ mt: 0.5, fontSize: "0.875rem", color: "var(--eb-muted)" }}
          >
            {formatBenefitCategory(row.category)} ·{" "}
            {formatEnrollmentStatus(row.status)}
          </Typography>
          {row.description ? (
            <Typography
              sx={{ mt: 1, fontSize: "0.875rem", color: "var(--eb-text)" }}
            >
              {row.description}
            </Typography>
          ) : null}
          {row.notes ? (
            <Typography
              sx={{ mt: 0.75, fontSize: "0.8rem", color: "var(--eb-muted)" }}
            >
              Note: {row.notes}
            </Typography>
          ) : null}
        </Box>
      ))}
    </Stack>
  );
}
