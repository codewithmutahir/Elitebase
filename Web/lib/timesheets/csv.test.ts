import assert from "node:assert/strict";
import {
  formatEmployeeNameForCsv,
  timesheetsToCsv,
  type TimesheetsCsvOptions,
} from "@/lib/timesheets/csv";
import type { TimesheetExportRow } from "@/lib/timesheets/export-rows";

function row(
  partial: Partial<TimesheetExportRow> &
    Pick<TimesheetExportRow, "employeeId" | "employeeName" | "date">
): TimesheetExportRow {
  return {
    id: partial.id ?? `row-${partial.employeeId}-${partial.date}`,
    employeeId: partial.employeeId,
    employeeName: partial.employeeName,
    date: partial.date,
    clockOutDate: partial.clockOutDate ?? null,
    clockIn: partial.clockIn ?? "2026-03-01T04:00:00.000Z",
    clockOut: partial.clockOut ?? "2026-03-01T12:00:00.000Z",
    clockInEventId: null,
    clockOutEventId: null,
    totalHours: partial.totalHours ?? 8,
    breakHours: partial.breakHours ?? 0,
    breakCount: 0,
    status: partial.status ?? "complete",
    clockInAttendanceStatus: "on_time",
    needsReview: false,
    scheduledTime: partial.scheduledTime ?? "09:00 – 17:00",
    onTime: partial.onTime ?? true,
    late: partial.late ?? false,
    absent: partial.absent ?? false,
    missingClockIn: partial.missingClockIn ?? false,
    missingClockOut: partial.missingClockOut ?? false,
    unpaidLeave: partial.unpaidLeave ?? false,
    bonusAmount: partial.bonusAmount ?? 0,
    department: partial.department ?? "Floor",
    payType: partial.payType ?? "hourly",
    rateAmount: partial.rateAmount ?? 20,
    wages: partial.wages ?? 160,
  };
}

function exportCsv(
  rows: TimesheetExportRow[],
  options: TimesheetsCsvOptions = {}
) {
  return timesheetsToCsv(rows, () => "9:00 AM", {
    currency: "USD",
    ...options,
  });
}

function testNameFormatting() {
  assert.equal(
    formatEmployeeNameForCsv("  Ali   Raza  "),
    "Ali Raza"
  );
}

function testPayrollColumnsAndCleanNames() {
  const csv = exportCsv(
    [
      row({
        employeeId: "a",
        employeeName: "  Ali   Raza ",
        date: "2026-03-02",
        wages: 160,
        bonusAmount: 50,
      }),
      row({
        employeeId: "a",
        employeeName: "Ali Raza",
        date: "2026-03-01",
        wages: 160,
        bonusAmount: 50,
      }),
      row({
        employeeId: "b",
        employeeName: "Sara Khan",
        date: "2026-03-01",
        payType: "salary",
        rateAmount: 3000,
        wages: 136.36,
        bonusAmount: 0,
      }),
    ],
    { groupByEmployee: true }
  );

  const lines = csv.trimEnd().split("\n");
  assert.ok(lines[0]?.includes("Wages"));
  assert.ok(lines[0]?.includes("Pay type"));
  assert.ok(lines[0]?.includes("Rate"));
  assert.ok(lines[0]?.includes("Total pay"));

  // No decorative "— N shift(s)" in the Employee column on detail/subtotal.
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const employeeCell = line.split(",")[0] ?? "";
    assert.ok(
      !employeeCell.includes("shift"),
      `Employee cell should stay clean: ${employeeCell}`
    );
  }

  assert.ok(csv.includes("Ali Raza"));
  assert.ok(!csv.includes("Ali   Raza"));
  assert.ok(csv.includes("Detail"));
  assert.ok(csv.includes("Subtotal"));

  // Bonus only on subtotal (one "50.00" for Ali, not on every detail row).
  const aliBonusHits = csv.match(/Ali Raza.*50\.00/g) ?? [];
  assert.ok(aliBonusHits.length >= 1);

  const headerCols = lines[0]!.split(",").length;
  for (const line of lines) {
    if (!line) continue;
    assert.equal(
      line.split(",").length,
      headerCols,
      `Column count mismatch: ${line}`
    );
  }
}

function testQuickbooksHasAmount() {
  const csv = exportCsv(
    [
      row({
        employeeId: "a",
        employeeName: "Ali Raza",
        date: "2026-03-01",
        totalHours: 10,
        wages: 200,
        rateAmount: 20,
      }),
    ],
    { format: "quickbooks", groupByEmployee: true }
  );
  assert.ok(csv.includes("Amount"));
  assert.ok(csv.includes("Rate"));
  assert.ok(csv.includes("Regular Pay"));
  assert.ok(csv.includes("Overtime Pay"));
}

testNameFormatting();
testPayrollColumnsAndCleanNames();
testQuickbooksHasAmount();
console.log("timesheets csv tests passed");
