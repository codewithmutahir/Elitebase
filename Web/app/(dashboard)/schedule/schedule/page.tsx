import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { listDepartmentsWithRoles } from "@/lib/departments/queries";
import { listScheduleEmployees, listShiftsForWeek } from "@/lib/schedules/queries";
import { parseWeekParam, formatWeekParam } from "@/lib/availability/week";
import { requireCompanySession } from "@/lib/employees/session";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const [{ week: weekParam }, { company }] = await Promise.all([
    searchParams,
    requireCompanySession(),
  ]);
  const weekMonday = parseWeekParam(weekParam);

  const [employees, shifts, departments] = await Promise.all([
    listScheduleEmployees(company.id),
    listShiftsForWeek(company.id, weekMonday),
    listDepartmentsWithRoles(company.id),
  ]);

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            minHeight: "40vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography color="text.secondary">Loading schedule…</Typography>
        </Box>
      }
    >
      <ScheduleView
        employees={employees}
        shifts={shifts}
        departments={departments}
        weekStart={formatWeekParam(weekMonday)}
      />
    </Suspense>
  );
}
