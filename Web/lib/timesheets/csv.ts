import type { TimesheetRow } from "@/lib/timesheets/pairing";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatStatus(status: TimesheetRow["status"]) {
  switch (status) {
    case "open":
      return "Open";
    case "complete":
      return "Complete";
    default:
      return "Incomplete";
  }
}

export function timesheetsToCsv(
  rows: TimesheetRow[],
  formatTime: (iso: string) => string
) {
  const header = [
    "Employee",
    "Date",
    "Clock in",
    "Clock out",
    "Total hours",
    "Status",
  ];

  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        escapeCsv(row.employeeName),
        row.date,
        row.clockIn ? escapeCsv(formatTime(row.clockIn)) : "",
        row.clockOut ? escapeCsv(formatTime(row.clockOut)) : "",
        row.totalHours != null ? String(row.totalHours) : "",
        formatStatus(row.status),
      ].join(",")
    ),
  ];

  return lines.join("\n");
}
