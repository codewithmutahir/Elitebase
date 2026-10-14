import { NextRequest, NextResponse } from "next/server";
import {
  companyTimezone,
  formatTime,
} from "@/lib/dashboard/format";
import { resolveCurrency } from "@/lib/currencies";
import { validateEmployeeForCompany } from "@/lib/timesheets/data";
import { getTimesheetExportRows } from "@/lib/timesheets/export-rows";
import { parseExportRange } from "@/lib/timesheets/dates";
import { timesheetsToCsv, type CsvExportFormat } from "@/lib/timesheets/csv";
import {
  getCachedTimesheetExport,
  timesheetExportCacheKey,
} from "@/lib/timesheets/export-request-cache";
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
  const employeeName =
    request.nextUrl.searchParams.get("employeeName") ?? undefined;
  const formatParam = request.nextUrl.searchParams.get("format");
  const format: CsvExportFormat =
    formatParam === "quickbooks" ? "quickbooks" : "standard";

  if (employeeId) {
    const valid = await validateEmployeeForCompany(company.id, employeeId);
    if (!valid) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
  }

  const range = parseExportRange(timezone, { month, from, to });
  const currency = resolveCurrency(company.currency);
  const cacheKey = timesheetExportCacheKey({
    companyId: company.id,
    from: range.from,
    to: range.to,
    employeeId,
    format,
    currency,
  });

  const { csv, filename } = await getCachedTimesheetExport(cacheKey, async () => {
    const rows = await getTimesheetExportRows(
      company.id,
      timezone,
      range.from,
      range.to,
      employeeId
    );

    const body = timesheetsToCsv(rows, (iso) => formatTime(iso, timezone), {
      format,
      groupByEmployee: !employeeId,
      currency,
    });

    let name: string;
    const formatSuffix = format === "quickbooks" ? "-quickbooks" : "";
    if (range.month) {
      const suffix = employeeId
        ? slugifyName(employeeName ?? "employee") || "employee"
        : "all";
      name = `timesheets-${range.month}-${suffix}${formatSuffix}.csv`;
    } else {
      name = `timesheets-${range.from}-to-${range.to}${formatSuffix}.csv`;
    }

    return { csv: body, filename: name };
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Private short cache — helps accidental double-fetch; data stays tenant-scoped.
      "Cache-Control": "private, max-age=8, stale-while-revalidate=0",
      Vary: "Cookie",
    },
  });
}
