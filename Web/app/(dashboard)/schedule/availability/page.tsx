import { Suspense } from "react";
import { AvailabilityView } from "@/components/schedule/availability-view";
import {
  listAvailabilityByCompany,
  listEmployeesForAvailability,
} from "@/lib/availability/queries";
import { parseWeekParam, formatWeekParam } from "@/lib/availability/week";
import { listDepartmentOptions } from "@/lib/departments/queries";
import { requireCompanySession } from "@/lib/employees/session";

export default async function TeamAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const [{ week: weekParam }, { company }] = await Promise.all([
    searchParams,
    requireCompanySession(),
  ]);
  const weekMonday = parseWeekParam(weekParam);

  const [employees, availability, departmentOptions] = await Promise.all([
    listEmployeesForAvailability(company.id),
    listAvailabilityByCompany(company.id),
    listDepartmentOptions(company.id),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Loading availability…
        </div>
      }
    >
      <AvailabilityView
        employees={employees}
        availability={availability}
        departmentOptions={departmentOptions}
        weekStart={formatWeekParam(weekMonday)}
      />
    </Suspense>
  );
}
