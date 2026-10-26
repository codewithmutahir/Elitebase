import { RosterView } from "@/components/team/roster-view";
import { listDepartmentOptions } from "@/lib/departments/queries";
import { listEmployees } from "@/lib/employees/queries";
import { requireCompanySession } from "@/lib/employees/session";
import { leaveYearForDate } from "@/lib/leave-balance/policy";
import { listLeaveBalancesForCompanyYear } from "@/lib/leave-balance/queries";

export default async function RosterPage() {
  const { company } = await requireCompanySession();
  const leaveYear = leaveYearForDate(
    new Date().toISOString().slice(0, 10),
    null,
    company.leave_year_type
  );
  const [employees, departmentOptions, leaveBalances] = await Promise.all([
    listEmployees(company.id),
    listDepartmentOptions(company.id),
    listLeaveBalancesForCompanyYear(company.id, leaveYear),
  ]);

  const leaveRemainingByEmployeeId: Record<string, string> = {};
  for (const row of leaveBalances) {
    if (row.employeeId) {
      leaveRemainingByEmployeeId[row.employeeId] =
        `${row.totalRemaining}/${row.totalAllotted}`;
    }
  }

  return (
    <RosterView
      employees={employees}
      departmentOptions={departmentOptions}
      currency={company.currency}
      leaveRemainingByEmployeeId={leaveRemainingByEmployeeId}
    />
  );
}
