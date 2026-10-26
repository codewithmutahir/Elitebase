import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PayslipsView } from "@/components/team/payslips-view";
import { dashboardPageIntroSx } from "@/lib/dashboard/sx";
import { requireCompanySession } from "@/lib/employees/session";
import { listEmployees } from "@/lib/employees/queries";
import { listCompanyPayslips } from "@/lib/payslips/queries";

export default async function TeamPayslipsPage() {
  const { company } = await requireCompanySession();
  const [payslips, employees] = await Promise.all([
    listCompanyPayslips(company.id),
    listEmployees(company.id),
  ]);

  return (
    <Stack spacing={3}>
      <Typography sx={dashboardPageIntroSx}>
        Generate drafts from attendance and payroll data, then review, approve,
        and publish. Employees only see published slips.
      </Typography>
      <PayslipsView
        payslips={payslips}
        employees={employees}
        currency={company.currency}
        companyName={company.name}
        logoUrl={company.logo_url}
      />
    </Stack>
  );
}
