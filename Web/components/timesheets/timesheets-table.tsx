"use client";

import {
  companyTimezone,
  formatTime,
} from "@/lib/dashboard/format";
import type { TimesheetRow } from "@/lib/timesheets/pairing";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";

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

  return (
    <DataTable>
      <DataTableHeader>
        <DataTableRow>
          <DataTableHead>Employee</DataTableHead>
          <DataTableHead>Date</DataTableHead>
          <DataTableHead>Clock in</DataTableHead>
          <DataTableHead>Clock out</DataTableHead>
          <DataTableHead>Total hours</DataTableHead>
          <DataTableHead>Status</DataTableHead>
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {rows.length === 0 ? (
          <DataTableRow>
            <DataTableCell colSpan={6}>
              <DataTableEmpty>
                No attendance records for this date range.
              </DataTableEmpty>
            </DataTableCell>
          </DataTableRow>
        ) : (
          rows.map((row) => (
            <DataTableRow key={row.id}>
              <DataTableCell sx={{ fontWeight: 600 }}>
                {row.employeeName}
              </DataTableCell>
              <DataTableCell>{row.date}</DataTableCell>
              <DataTableCell>
                {row.clockIn ? formatTime(row.clockIn, tz) : "—"}
              </DataTableCell>
              <DataTableCell>
                {row.clockOut ? formatTime(row.clockOut, tz) : "—"}
              </DataTableCell>
              <DataTableCell sx={{ fontFamily: "var(--font-mono), monospace" }}>
                {formatHours(row.totalHours)}
              </DataTableCell>
              <DataTableCell>
                <StatusBadge
                  tone={
                    row.status === "open"
                      ? "warning"
                      : row.status === "complete"
                        ? "success"
                        : "neutral"
                  }
                >
                  {row.status === "open"
                    ? "Open"
                    : row.status === "complete"
                      ? "Complete"
                      : "Incomplete"}
                </StatusBadge>
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}
