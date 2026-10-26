import { notFound } from "next/navigation";
import { EmployeeProfileView } from "@/components/team/employee-profile";
import { getEmployeeProfile } from "@/lib/employees/profile-queries";
import { requireCompanySession } from "@/lib/employees/session";
import { leaveYearForDate } from "@/lib/leave-balance/policy";
import {
  getLeaveBalanceView,
  listLeaveBalanceAdjustments,
} from "@/lib/leave-balance/queries";

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

  const today = new Date().toISOString().slice(0, 10);
  const leaveYear = leaveYearForDate(
    today,
    employee.hire_date,
    company.leave_year_type
  );
  const [leaveBalance, leaveAdjustments] = await Promise.all([
    getLeaveBalanceView(company.id, employee.id, leaveYear),
    listLeaveBalanceAdjustments(company.id, employee.id, 10),
  ]);

  return (
    <EmployeeProfileView
      initialEmployee={employee}
      companyName={company.name}
      leaveBalance={leaveBalance}
      leaveAdjustments={leaveAdjustments}
    />
  );
}
