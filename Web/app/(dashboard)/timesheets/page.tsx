import { TimesheetsExportPanel } from "@/components/timesheets/timesheets-export-panel";
import { TimesheetsView } from "@/components/timesheets/timesheets-view";
import { companyTimezone } from "@/lib/dashboard/format";
import {
  getTimesheetsPage,
  listAttendanceMonths,
  listTimesheetEmployeeOptions,
} from "@/lib/timesheets/data";
import { parseDateRange } from "@/lib/timesheets/dates";
import { requireTimesheetsSession } from "@/lib/timesheets/session";

type TimesheetsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
  }>;
};

export default async function TimesheetsPage({ searchParams }: TimesheetsPageProps) {
  const { company } = await requireTimesheetsSession();
  const timezone = companyTimezone(company.timezone);
  const params = await searchParams;
  const range = parseDateRange(timezone, params.from, params.to);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const result = await getTimesheetsPage(
    company.id,
    timezone,
    range.from,
    range.to,
    page
  );

  const [months, employees] = await Promise.all([
    listAttendanceMonths(company.id, timezone),
    listTimesheetEmployeeOptions(company.id),
  ]);

  return (
    <div className="space-y-6">
      <TimesheetsExportPanel months={months} employees={employees} />
      <TimesheetsView
        rows={result.rows}
        timezone={company.timezone}
        from={range.from}
        to={range.to}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
      />
    </div>
  );
}
