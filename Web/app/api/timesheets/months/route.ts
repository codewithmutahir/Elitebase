import { NextResponse } from "next/server";
import { companyTimezone } from "@/lib/dashboard/format";
import { listAttendanceMonths } from "@/lib/timesheets/data";
import { requireTimesheetsSession } from "@/lib/timesheets/session";

export async function GET() {
  const { company } = await requireTimesheetsSession();
  const timezone = companyTimezone(company.timezone);
  const months = await listAttendanceMonths(company.id, timezone);

  return NextResponse.json(
    { months },
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}
