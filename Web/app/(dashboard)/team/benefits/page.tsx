import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BenefitsView } from "@/components/team/benefits-view";
import {
  listCompanyBenefits,
  listCompanyEmployeeBenefits,
} from "@/lib/benefits/queries";
import { dashboardPageIntroSx } from "@/lib/dashboard/sx";
import { requireCompanySession } from "@/lib/employees/session";
import { listEmployees } from "@/lib/employees/queries";

export default async function TeamBenefitsPage() {
  const { company } = await requireCompanySession();
  const [benefits, assignments, employees] = await Promise.all([
    listCompanyBenefits(company.id),
    listCompanyEmployeeBenefits(company.id),
    listEmployees(company.id),
  ]);

  return (
    <Stack spacing={3}>
      <Typography sx={dashboardPageIntroSx}>
        Create benefits and assign them so employees can view coverage in their
        portal.
      </Typography>
      <BenefitsView
        benefits={benefits}
        assignments={assignments}
        employees={employees}
      />
    </Stack>
  );
}
