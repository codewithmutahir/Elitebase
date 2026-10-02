import Stack from "@mui/material/Stack";
import { TimesheetsExportPanel } from "@/components/timesheets/timesheets-export-panel";
import { TimesheetsView } from "@/components/timesheets/timesheets-view";
import { companyTimezone } from "@/lib/dashboard/format";
import {
  getTimesheetsPage,
  listAttendanceMonths,
  listTimesheetEmployeeOptions,
  validateEmployeeForCompany,
} from "@/lib/timesheets/data";
import {
  buildTimesheetsQueryString,
  parseTimesheetsViewParams,
} from "@/lib/timesheets/view-params";
import { requireTimesheetsSession } from "@/lib/timesheets/session";

type TimesheetsPageProps = {
  searchParams: Promise<{
    month?: string;
    from?: string;
    to?: string;
    employeeId?: string;
    page?: string;
  }>;
};

export default async function TimesheetsPage({ searchParams }: TimesheetsPageProps) {
  const [{ company }, params] = await Promise.all([
    requireTimesheetsSession(),
    searchParams,
  ]);
  const timezone = companyTimezone(company.timezone);

  const [months, employees] = await Promise.all([
    listAttendanceMonths(company.id, timezone),
    listTimesheetEmployeeOptions(company.id),
  ]);

  let employeeId =
    params.employeeId && params.employeeId !== "all"
      ? params.employeeId
      : undefined;

  if (employeeId) {
    const valid = await validateEmployeeForCompany(company.id, employeeId);
    if (!valid) employeeId = undefined;
  }

  const view = parseTimesheetsViewParams(
    timezone,
    { ...params, employeeId: employeeId ?? params.employeeId },
    months
  );

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const result = await getTimesheetsPage(
    company.id,
    timezone,
    view.from,
    view.to,
    page,
    undefined,
    view.employeeId
  );

  const queryBase = buildTimesheetsQueryString({
    month: view.month,
    from: view.from,
    to: view.to,
    employeeId: view.employeeId ?? "all",
  });

  return (
    <Stack spacing={3}>
      <TimesheetsView
        rows={result.rows}
        timezone={company.timezone}
        months={months}
        employees={employees}
        selectedMonth={view.month}
        selectedEmployeeId={view.employeeId ?? "all"}
        from={view.from}
        to={view.to}
        mode={view.mode}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        queryBase={queryBase}
      />
      <TimesheetsExportPanel months={months} employees={employees} />
    </Stack>
  );
}
