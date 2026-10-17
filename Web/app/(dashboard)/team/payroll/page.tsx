import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PayrollView } from "@/components/team/payroll-view";
import { companyTimezone } from "@/lib/dashboard/format";
import { dashboardPageIntroSx } from "@/lib/dashboard/sx";
import { requireCompanySession } from "@/lib/employees/session";
import {
  getPayrollYearBreakdown,
  listPayrollEmployees,
} from "@/lib/payroll/queries";

export default async function TeamPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; year?: string }>;
}) {
  const { employeeId: employeeIdParam, year: yearParam } = await searchParams;
  const { company } = await requireCompanySession();
  const employees = await listPayrollEmployees(company.id);

  const nowYear = new Date().getFullYear();
  const parsedYear = Number(yearParam);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : nowYear;
  const yearOptions = [nowYear + 1, nowYear, nowYear - 1, nowYear - 2];

  const selectedEmployee =
    employees.find((employee) => employee.id === employeeIdParam) ??
    employees[0] ??
    null;

  const breakdown = selectedEmployee
    ? await getPayrollYearBreakdown(
        company.id,
        companyTimezone(company.timezone),
        selectedEmployee,
        year
      )
    : null;

  return (
    <Stack spacing={3}>
      <Typography sx={dashboardPageIntroSx}>
        Review estimated salary pay and policy-based bonus due for each month.
        Configure bonus amount, policy, and cycle start on the employee Job
        Details tab.
      </Typography>
      <PayrollView
        employees={employees}
        breakdown={breakdown}
        selectedEmployeeId={selectedEmployee?.id ?? null}
        year={year}
        yearOptions={yearOptions}
        currency={company.currency}
      />
    </Stack>
  );
}
