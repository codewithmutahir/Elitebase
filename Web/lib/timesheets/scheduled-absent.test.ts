/**
 * Run: npm run test:scheduled-absent (from Web/)
 */
import assert from "node:assert/strict";
import {
  buildDefaultAbsentRows,
  enumerateDateKeys,
} from "./scheduled-absent";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

function testEnumerateDateKeys() {
  assert.deepEqual(enumerateDateKeys("2026-01-01", "2026-01-03"), [
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
  ]);
}

function testWorkingDayAbsentWithoutSchedule() {
  const baseRows: TimesheetRow[] = [];
  const schedules = new Map();
  const employees = [
    {
      id: "e1",
      full_name: "Alex",
      working_days: [1, 2, 3, 4, 5],
    },
  ];
  // 2026-01-01 is Thursday (ISO 4) — working day
  const absent = buildDefaultAbsentRows(
    baseRows,
    schedules,
    employees,
    [],
    "2026-01-01",
    "2026-01-01"
  );
  assert.equal(absent.length, 1);
  assert.equal(absent[0]?.id, "absent:e1:2026-01-01");
}

function testApprovedLeaveSkipsAbsent() {
  const absent = buildDefaultAbsentRows(
    [],
    new Map(),
    [{ id: "e1", full_name: "Alex", working_days: [1, 2, 3, 4, 5] }],
    [{ employee_id: "e1", start_date: "2026-01-01", end_date: "2026-01-01" }],
    "2026-01-01",
    "2026-01-01"
  );
  assert.equal(absent.length, 0);
}

function testClockInSkipsAbsent() {
  const baseRows: TimesheetRow[] = [
    {
      id: "row1",
      employeeId: "e1",
      employeeName: "Alex",
      date: "2026-01-01",
      clockOutDate: null,
      clockIn: "2026-01-01T14:00:00.000Z",
      clockOut: null,
      clockInEventId: "a",
      clockOutEventId: null,
      totalHours: null,
      breakHours: null,
      breakCount: 0,
      status: "open",
      clockInAttendanceStatus: "on_time",
      needsReview: false,
    },
  ];
  const absent = buildDefaultAbsentRows(
    baseRows,
    new Map(),
    [{ id: "e1", full_name: "Alex", working_days: [4] }],
    [],
    "2026-01-01",
    "2026-01-01"
  );
  assert.equal(absent.length, 0);
}

const tests = [
  testEnumerateDateKeys,
  testWorkingDayAbsentWithoutSchedule,
  testApprovedLeaveSkipsAbsent,
  testClockInSkipsAbsent,
];

for (const test of tests) test();
console.log(`timesheets/scheduled-absent.test.ts: ${tests.length} passed`);
