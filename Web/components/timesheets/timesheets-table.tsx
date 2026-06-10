import {
  companyTimezone,
  formatTime,
} from "@/lib/dashboard/format";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

function StatusBadge({ status }: { status: TimesheetRow["status"] }) {
  const styles = {
    open: "bg-[#FEF3C7] text-[#B45309]",
    complete: "bg-[#D1FAE5] text-[#047857]",
    incomplete: "bg-[#F1F5F9] text-[#64748B]",
  } as const;

  const labels = {
    open: "Open",
    complete: "Complete",
    incomplete: "Incomplete",
  } as const;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatHours(hours: number | null) {
  if (hours == null) return "—";
  return hours.toFixed(2);
}

type TimesheetsTableProps = {
  rows: TimesheetRow[];
  timezone: string | null | undefined;
};

export function TimesheetsTable({ rows, timezone }: TimesheetsTableProps) {
  const tz = companyTimezone(timezone);

  if (rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-[#64748B]">
        No attendance records for this date range.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-6 py-3">Employee</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Clock in</th>
            <th className="px-6 py-3">Clock out</th>
            <th className="px-6 py-3">Total hours</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#F8FAFC]">
              <td className="px-6 py-4 font-semibold text-[#0F172A]">
                {row.employeeName}
              </td>
              <td className="px-6 py-4 text-[#334155]">{row.date}</td>
              <td className="px-6 py-4 text-[#334155]">
                {row.clockIn ? formatTime(row.clockIn, tz) : "—"}
              </td>
              <td className="px-6 py-4 text-[#334155]">
                {row.clockOut ? formatTime(row.clockOut, tz) : "—"}
              </td>
              <td className="px-6 py-4 font-mono text-[#334155]">
                {formatHours(row.totalHours)}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
