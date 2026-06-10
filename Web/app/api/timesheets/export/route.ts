import { NextRequest, NextResponse } from "next/server";
import {
  companyTimezone,
  formatTime,
} from "@/lib/dashboard/format";
import { parseDateRange } from "@/lib/timesheets/dates";
import { getAllTimesheetRows } from "@/lib/timesheets/data";
import { timesheetsToCsv } from "@/lib/timesheets/csv";
import { requireTimesheetsSession } from "@/lib/timesheets/session";

export async function GET(request: NextRequest) {
  const { company } = await requireTimesheetsSession();
  const timezone = companyTimezone(company.timezone);

  const from = request.nextUrl.searchParams.get("from") ?? undefined;
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const range = parseDateRange(timezone, from, to);

  const rows = await getAllTimesheetRows(
    company.id,
    timezone,
    range.from,
    range.to
  );

  const csv = timesheetsToCsv(rows, (iso) => formatTime(iso, timezone));
  const filename = `timesheets-${range.from}-to-${range.to}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
