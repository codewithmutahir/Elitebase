import { NextRequest, NextResponse } from "next/server";
import {
  companyTimezone,
  formatTime,
} from "@/lib/dashboard/format";
import {
  getAllTimesheetRows,
  validateEmployeeForCompany,
} from "@/lib/timesheets/data";
import { parseExportRange } from "@/lib/timesheets/dates";
import { timesheetsToCsv } from "@/lib/timesheets/csv";
import { requireTimesheetsSession } from "@/lib/timesheets/session";

function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function GET(request: NextRequest) {
  const { company } = await requireTimesheetsSession();
  const timezone = companyTimezone(company.timezone);

  const month = request.nextUrl.searchParams.get("month");
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const employeeId = request.nextUrl.searchParams.get("employeeId") ?? undefined;
  const employeeName = request.nextUrl.searchParams.get("employeeName") ?? undefined;

  if (employeeId) {
    const valid = await validateEmployeeForCompany(company.id, employeeId);
    if (!valid) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
  }

  const range = parseExportRange(timezone, { month, from, to });

  const rows = await getAllTimesheetRows(
    company.id,
    timezone,
    range.from,
    range.to,
    employeeId
  );

  const csv = timesheetsToCsv(rows, (iso) => formatTime(iso, timezone));

  let filename: string;
  if (range.month) {
    const suffix = employeeId
      ? slugifyName(employeeName ?? "employee") || "employee"
      : "all";
    filename = `timesheets-${range.month}-${suffix}.csv`;
  } else {
    filename = `timesheets-${range.from}-to-${range.to}.csv`;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
