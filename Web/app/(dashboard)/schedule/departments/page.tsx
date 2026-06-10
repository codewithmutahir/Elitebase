import { DepartmentsView } from "@/components/schedule/departments-view";
import { listDepartmentsWithRoles } from "@/lib/departments/queries";
import { requireCompanySession } from "@/lib/employees/session";

export default async function DepartmentsPage() {
  const { company } = await requireCompanySession();
  const departments = await listDepartmentsWithRoles(company.id);

  return <DepartmentsView initialDepartments={departments} />;
}
