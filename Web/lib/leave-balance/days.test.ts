import assert from "node:assert/strict";
import {
  allocateAgainstBalance,
  countWorkingDaysInRange,
  splitWorkingDaysByLeaveYear,
} from "@/lib/leave-balance/days";
import {
  leaveYearForDate,
  prorateLeaveTotal,
} from "@/lib/leave-balance/policy";

function testCountMonFriWeek() {
  // 2026-01-05 Mon … 2026-01-09 Fri → 5; weekend ignored if included
  assert.equal(
    countWorkingDaysInRange("2026-01-05", "2026-01-11", [1, 2, 3, 4, 5]),
    5
  );
}

function testCountWithSundayOffOnly() {
  // Oct 2026 has 4 Sundays; range full month → 31 - 4 = 27 if off = Sunday only
  // Working days Mon–Sat (1–6): Sundays excluded
  assert.equal(
    countWorkingDaysInRange("2026-10-01", "2026-10-31", [1, 2, 3, 4, 5, 6]),
    27
  );
}

function testCrossYearSplit() {
  // Fri 2026-12-31 + Fri 2027-01-01 with Mon–Fri → 1 day each year
  const slices = splitWorkingDaysByLeaveYear(
    "2026-12-31",
    "2027-01-01",
    [1, 2, 3, 4, 5],
    null,
    "calendar"
  );
  assert.deepEqual(slices, [
    { year: 2026, days: 1 },
    { year: 2027, days: 1 },
  ]);
}

function testAllocateLwp() {
  assert.deepEqual(allocateAgainstBalance(5, 3), { charged: 3, lwp: 2 });
  assert.deepEqual(allocateAgainstBalance(2, 5), { charged: 2, lwp: 0 });
  assert.deepEqual(allocateAgainstBalance(0, 5), { charged: 0, lwp: 0 });
}

function testLeaveYearAnniversary() {
  // Hire June 15 → dates before June 15 map to previous leave year
  assert.equal(leaveYearForDate("2026-06-15", "2024-06-15", "anniversary"), 2026);
  assert.equal(leaveYearForDate("2026-06-14", "2024-06-15", "anniversary"), 2025);
  assert.equal(leaveYearForDate("2026-06-14", null, "calendar"), 2026);
}

function testProrate() {
  // Hired July 2026 → 6 months remaining → half of 12 = 6
  assert.equal(
    prorateLeaveTotal(12, 2026, "2026-07-01", true, "calendar"),
    6
  );
  assert.equal(
    prorateLeaveTotal(12, 2026, "2026-07-01", false, "calendar"),
    12
  );
  assert.equal(
    prorateLeaveTotal(12, 2026, "2025-03-01", true, "calendar"),
    12
  );
}

const tests = [
  testCountMonFriWeek,
  testCountWithSundayOffOnly,
  testCrossYearSplit,
  testAllocateLwp,
  testLeaveYearAnniversary,
  testProrate,
];

for (const test of tests) test();
console.log(`leave-balance/days.test.ts: ${tests.length} passed`);
