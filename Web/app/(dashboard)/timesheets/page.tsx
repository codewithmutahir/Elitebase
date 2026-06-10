import { TimesheetsView } from "@/components/timesheets/timesheets-view";
import { companyTimezone } from "@/lib/dashboard/format";
import { getTimesheetsPage } from "@/lib/timesheets/data";
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

  return (
    <TimesheetsView
      rows={result.rows}
      timezone={company.timezone}
      from={range.from}
      to={range.to}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
    />
  );
}
