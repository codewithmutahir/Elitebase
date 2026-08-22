import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type CsvExportFormat = "standard" | "quickbooks";

export type TimesheetsCsvOptions = {
  format?: CsvExportFormat;
  /** Group rows by employee with subtotals (for all-employee exports). */
  groupByEmployee?: boolean;
};

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

function sortRowsByEmployee(rows: TimesheetRow[]): TimesheetRow[] {
  return [...rows].sort((a, b) => {
    const nameCmp = a.employeeName.localeCompare(b.employeeName, "en", {
      sensitivity: "base",
    });
    if (nameCmp !== 0) return nameCmp;
    return b.date.localeCompare(a.date);
  });
}

function groupRowsByEmployee(rows: TimesheetRow[]): TimesheetRow[][] {
  const sorted = sortRowsByEmployee(rows);
  const groups: TimesheetRow[][] = [];
  let current: TimesheetRow[] = [];

  for (const row of sorted) {
    const prevName = current[0]?.employeeName;
    if (prevName && row.employeeName !== prevName) {
      groups.push(current);
      current = [];
    }
    current.push(row);
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

function roundHours(hours: number) {
  return Math.round(hours * 100) / 100;
}

function sumHours(rows: TimesheetRow[]) {
  return roundHours(
    rows.reduce((sum, row) => sum + (row.totalHours ?? 0), 0)
  );
}

function sumBreakHours(rows: TimesheetRow[]) {
  return roundHours(
    rows.reduce((sum, row) => sum + (row.breakHours ?? 0), 0)
  );
}

function standardRowLine(row: TimesheetRow, formatTime: (iso: string) => string) {
  return [
    escapeCsv(row.employeeName),
    row.date,
    row.clockIn ? escapeCsv(formatTime(row.clockIn)) : "",
    row.clockOut ? escapeCsv(formatTime(row.clockOut)) : "",
    row.breakHours != null ? String(row.breakHours) : "",
    row.totalHours != null ? String(row.totalHours) : "",
    formatStatus(row.status),
  ].join(",");
}

function quickbooksRowsForShift(row: TimesheetRow): string[][] {
  if (row.totalHours == null || row.totalHours <= 0) return [];

  const regularHours = Math.min(row.totalHours, 8);
  const overtimeHours = Math.max(row.totalHours - 8, 0);
  const breakNote =
    row.breakHours != null && row.breakHours > 0
      ? `${row.breakHours}h breaks`
      : "";

  const entries = [
    [
      escapeCsv(row.employeeName),
      row.date,
      "Regular Pay",
      String(regularHours),
      row.breakHours != null ? String(row.breakHours) : "",
      breakNote,
    ],
  ];

  if (overtimeHours > 0) {
    entries.push([
      escapeCsv(row.employeeName),
      row.date,
      "Overtime Pay",
      String(roundHours(overtimeHours)),
      "",
      breakNote,
    ]);
  }

  return entries;
}

export function timesheetsToCsv(
  rows: TimesheetRow[],
  formatTime: (iso: string) => string,
  options: TimesheetsCsvOptions = {}
) {
  const format = options.format ?? "standard";
  const groupByEmployee = options.groupByEmployee ?? false;
  const orderedRows = groupByEmployee ? sortRowsByEmployee(rows) : rows;
  const employeeGroups = groupByEmployee ? groupRowsByEmployee(orderedRows) : null;

  if (format === "quickbooks") {
    const header = [
      "Employee",
      "Date",
      "Pay Item",
      "Hours",
      "Break Hours",
      "Notes",
    ];

    const lines = [header.join(",")];

    if (employeeGroups) {
      for (let index = 0; index < employeeGroups.length; index += 1) {
        const group = employeeGroups[index];
        if (index > 0) lines.push("");

        const employeeName = group[0]?.employeeName ?? "Unknown";
        lines.push(
          [
            escapeCsv(`${employeeName} — ${group.length} shift(s)`),
            "",
            "",
            "",
            "",
            "",
          ].join(",")
        );

        for (const row of group) {
          for (const entry of quickbooksRowsForShift(row)) {
            lines.push(entry.join(","));
          }
        }

        lines.push(
          [
            escapeCsv(employeeName),
            "",
            "Subtotal",
            String(sumHours(group)),
            sumBreakHours(group) > 0 ? String(sumBreakHours(group)) : "",
            `${group.length} shift(s)`,
          ].join(",")
        );
      }
    } else {
      for (const row of orderedRows) {
        for (const entry of quickbooksRowsForShift(row)) {
          lines.push(entry.join(","));
        }
      }
    }

    return lines.join("\n");
  }

  const header = [
    "Employee",
    "Date",
    "Clock in",
    "Clock out",
    "Break hours",
    "Total hours",
    "Status",
  ];

  const lines = [header.join(",")];

  if (employeeGroups) {
    for (let index = 0; index < employeeGroups.length; index += 1) {
      const group = employeeGroups[index];
      if (index > 0) lines.push("");

      const employeeName = group[0]?.employeeName ?? "Unknown";
      lines.push(
        [
          escapeCsv(`${employeeName} — ${group.length} shift(s)`),
          "",
          "",
          "",
          "",
          "",
          "",
        ].join(",")
      );

      for (const row of group) {
        lines.push(standardRowLine(row, formatTime));
      }

      lines.push(
        [
          escapeCsv(employeeName),
          "",
          "",
          "",
          "",
          String(sumHours(group)),
          `Subtotal (${group.length} shift(s))`,
        ].join(",")
      );
    }
  } else {
    for (const row of orderedRows) {
      lines.push(standardRowLine(row, formatTime));
    }
  }

  return lines.join("\n");
}
