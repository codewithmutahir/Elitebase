import { requireCompanySession } from "@/lib/employees/session";
import { listEmployees } from "@/lib/employees/queries";
import { listTimeOffRequests } from "@/lib/time-off/queries";
import { TimeOffView } from "@/components/team/time-off-view";

export default async function TimeOffPage() {
  const { company } = await requireCompanySession();
  const [requests, employees] = await Promise.all([
    listTimeOffRequests(company.id),
    listEmployees(company.id),
  ]);

  return <TimeOffView requests={requests} employees={employees} />;
}
