import { notFound } from "next/navigation";
import { EmployeeProfileView } from "@/components/team/employee-profile";
import { getEmployeeProfile } from "@/lib/employees/profile-queries";
import { requireCompanySession } from "@/lib/employees/session";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { company }] = await Promise.all([params, requireCompanySession()]);
  const employee = await getEmployeeProfile(company.id, id);

  if (!employee) {
    notFound();
  }

  return (
    <EmployeeProfileView
      initialEmployee={employee}
      companyName={company.name}
    />
  );
}
