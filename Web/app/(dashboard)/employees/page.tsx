import { RosterView } from "@/components/team/roster-view";
import { listDepartmentOptions } from "@/lib/departments/queries";
import { listEmployees } from "@/lib/employees/queries";
import { requireCompanySession } from "@/lib/employees/session";

export default async function RosterPage() {
  const { company } = await requireCompanySession();
  const [employees, departmentOptions] = await Promise.all([
    listEmployees(company.id),
    listDepartmentOptions(company.id),
  ]);

  return (
    <RosterView
      employees={employees}
      departmentOptions={departmentOptions}
      currency={company.currency}
    />
  );
}
