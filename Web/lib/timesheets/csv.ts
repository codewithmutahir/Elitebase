import { resolveCurrency } from "@/lib/currencies";
import type { TimesheetExportRow } from "@/lib/timesheets/export-rows";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type CsvExportFormat = "standard" | "quickbooks";

export type TimesheetsCsvOptions = {
  format?: CsvExportFormat;
  /** Group rows by employee with subtotals (for all-employee exports). */
  groupByEmployee?: boolean;
  /** ISO currency code for Rate / Wages / Bonus columns. */
  currency?: string | null;
};

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Clean display name for payroll (collapse whitespace, no decorative suffixes). */
export function formatEmployeeNameForCsv(name: string) {
  return name.replace(/\s+/g, " ").trim();
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

function formatPayType(payType: TimesheetExportRow["payType"]) {
  return payType === "salary" ? "Salary" : "Hourly";
}

function formatRateUnit(payType: TimesheetExportRow["payType"]) {
  return payType === "salary" ? "month" : "hour";
}

function money(value: number) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function optionalMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "";
  return money(value);
}

function sortRowsByEmployee(rows: TimesheetExportRow[]): TimesheetExportRow[] {
  return [...rows].sort((a, b) => {
    const nameCmp = formatEmployeeNameForCsv(a.employeeName).localeCompare(
      formatEmployeeNameForCsv(b.employeeName),
      "en",
      { sensitivity: "base" }
    );
    if (nameCmp !== 0) return nameCmp;
    return a.date.localeCompare(b.date);
  });
}

function groupRowsByEmployee(rows: TimesheetExportRow[]): TimesheetExportRow[][] {
  const sorted = sortRowsByEmployee(rows);
  const groups: TimesheetExportRow[][] = [];
  let current: TimesheetExportRow[] = [];

  for (const row of sorted) {
    const prevId = current[0]?.employeeId;
    if (prevId && row.employeeId !== prevId) {
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

function sumHours(rows: TimesheetExportRow[]) {
  return roundHours(
    rows.reduce((sum, row) => sum + (row.totalHours ?? 0), 0)
  );
}

function sumBreakHours(rows: TimesheetExportRow[]) {
  return roundHours(
    rows.reduce((sum, row) => sum + (row.breakHours ?? 0), 0)
  );
}

function sumWages(rows: TimesheetExportRow[]) {
  return Math.round(rows.reduce((sum, row) => sum + row.wages, 0) * 100) / 100;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

const STANDARD_HEADER = [
  "Employee",
  "Department",
  "Pay type",
  "Rate",
  "Rate unit",
  "Currency",
  "Shift date",
  "Clock out date",
  "Clock in",
  "Clock out",
  "Break hours",
  "Total hours",
  "Wages",
  "Bonus",
  "Total pay",
  "Row type",
  "Status",
  "Scheduled time",
  "On time",
  "Late",
  "Absent",
  "Missing clock in",
  "Missing clock out",
  "Unpaid leave",
] as const;

function standardDetailLine(
  row: TimesheetExportRow,
  formatTime: (iso: string) => string,
  currency: string
) {
  const name = formatEmployeeNameForCsv(row.employeeName);
  const wages = row.wages;

  return [
    escapeCsv(name),
    escapeCsv(row.department),
    formatPayType(row.payType),
    row.rateAmount > 0 ? money(row.rateAmount) : "",
    formatRateUnit(row.payType),
    currency,
    row.date,
    row.clockOutDate ?? "",
    row.clockIn ? escapeCsv(formatTime(row.clockIn)) : "",
    row.clockOut ? escapeCsv(formatTime(row.clockOut)) : "",
    row.breakHours != null ? String(row.breakHours) : "",
    row.totalHours != null ? String(row.totalHours) : "",
    optionalMoney(wages),
    "", // bonus only on subtotal — avoids double-counting
    optionalMoney(wages),
    "Detail",
    formatStatus(row.status),
    escapeCsv(row.scheduledTime),
    yesNo(row.onTime),
    yesNo(row.late),
    yesNo(row.absent),
    yesNo(row.missingClockIn),
    yesNo(row.missingClockOut),
    yesNo(row.unpaidLeave),
  ].join(",");
}

function standardSubtotalLine(
  group: TimesheetExportRow[],
  currency: string
) {
  const first = group[0];
  const name = formatEmployeeNameForCsv(first?.employeeName ?? "Unknown");
  const wages = sumWages(group);
  const bonus = first?.bonusAmount ?? 0;
  const totalPay = Math.round((wages + bonus) * 100) / 100;

  return [
    escapeCsv(name),
    escapeCsv(first?.department ?? ""),
    first ? formatPayType(first.payType) : "",
    first && first.rateAmount > 0 ? money(first.rateAmount) : "",
    first ? formatRateUnit(first.payType) : "",
    currency,
    "",
    "",
    "",
    "",
    sumBreakHours(group) > 0 ? String(sumBreakHours(group)) : "",
    String(sumHours(group)),
    money(wages),
    bonus > 0 ? money(bonus) : "",
    money(totalPay),
    "Subtotal",
    `${group.length} shift(s)`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ].join(",");
}

function quickbooksRowsForShift(
  row: TimesheetExportRow,
  currency: string
): string[][] {
  if (row.totalHours == null || row.totalHours <= 0) return [];

  const name = formatEmployeeNameForCsv(row.employeeName);
  const regularHours = Math.min(row.totalHours, 8);
  const overtimeHours = Math.max(row.totalHours - 8, 0);
  const rate =
    row.payType === "hourly" && row.rateAmount > 0
      ? money(row.rateAmount)
      : "";
  const regularWages =
    row.payType === "hourly"
      ? money((regularHours / row.totalHours) * row.wages)
      : money(row.wages);
  const otWages =
    row.payType === "hourly" && overtimeHours > 0
      ? money((overtimeHours / row.totalHours) * row.wages)
      : "";

  const entries = [
    [
      escapeCsv(name),
      row.date,
      "Regular Pay",
      String(roundHours(regularHours)),
      rate,
      currency,
      regularWages,
      row.breakHours != null ? String(row.breakHours) : "",
    ],
  ];

  if (overtimeHours > 0) {
    entries.push([
      escapeCsv(name),
      row.date,
      "Overtime Pay",
      String(roundHours(overtimeHours)),
      rate,
      currency,
      otWages,
      "",
    ]);
  }

  return entries;
}

export function timesheetsToCsv(
  rows: TimesheetExportRow[],
  formatTime: (iso: string) => string,
  options: TimesheetsCsvOptions = {}
) {
  const format = options.format ?? "standard";
  const groupByEmployee = options.groupByEmployee ?? false;
  const currency = resolveCurrency(options.currency);
  const orderedRows = groupByEmployee ? sortRowsByEmployee(rows) : rows;
  const employeeGroups = groupByEmployee
    ? groupRowsByEmployee(orderedRows)
    : null;

  if (format === "quickbooks") {
    const header = [
      "Employee",
      "Date",
      "Pay Item",
      "Hours",
      "Rate",
      "Currency",
      "Amount",
      "Break Hours",
    ];

    const lines = [header.join(",")];

    if (employeeGroups) {
      for (let index = 0; index < employeeGroups.length; index += 1) {
        const group = employeeGroups[index];
        if (index > 0) lines.push("");

        for (const row of group) {
          for (const entry of quickbooksRowsForShift(row, currency)) {
            lines.push(entry.join(","));
          }
        }

        const name = formatEmployeeNameForCsv(
          group[0]?.employeeName ?? "Unknown"
        );
        const wages = sumWages(group);
        const bonus = group[0]?.bonusAmount ?? 0;
        lines.push(
          [
            escapeCsv(name),
            "",
            "Subtotal",
            String(sumHours(group)),
            "",
            currency,
            money(wages),
            sumBreakHours(group) > 0 ? String(sumBreakHours(group)) : "",
          ].join(",")
        );
        if (bonus > 0) {
          lines.push(
            [
              escapeCsv(name),
              "",
              "Bonus",
              "",
              "",
              currency,
              money(bonus),
              "",
            ].join(",")
          );
        }
      }
    } else {
      for (const row of orderedRows) {
        for (const entry of quickbooksRowsForShift(row, currency)) {
          lines.push(entry.join(","));
        }
      }
    }

    return `${lines.join("\n")}\n`;
  }

  const lines = [STANDARD_HEADER.join(",")];

  if (employeeGroups) {
    for (let index = 0; index < employeeGroups.length; index += 1) {
      const group = employeeGroups[index];
      if (index > 0) lines.push("");

      for (const row of group) {
        lines.push(standardDetailLine(row, formatTime, currency));
      }
      lines.push(standardSubtotalLine(group, currency));
    }
  } else {
    for (const row of orderedRows) {
      lines.push(standardDetailLine(row, formatTime, currency));
    }
    if (orderedRows.length > 0) {
      lines.push(standardSubtotalLine(orderedRows, currency));
    }
  }

  return `${lines.join("\n")}\n`;
}
