/**
 * Run: npm run test:attendance-dedupe
 */
import assert from "node:assert/strict";
import { planAttendanceVoids } from "./dedupe-plan";

const employee = {
  employee_id: "e1",
  employee_name: "Test User",
};

function testDuplicateClockIns() {
  const proposals = planAttendanceVoids([
    {
      id: "a",
      ...employee,
      type: "clock_in",
      timestamp: "2026-07-23T09:00:00.000Z",
    },
    {
      id: "b",
      ...employee,
      type: "clock_in",
      timestamp: "2026-07-23T09:05:00.000Z",
    },
    {
      id: "c",
      ...employee,
      type: "clock_out",
      timestamp: "2026-07-23T17:00:00.000Z",
    },
  ]);

  assert.equal(proposals.length, 1);
  assert.equal(proposals[0]?.id, "b");
  assert.equal(proposals[0]?.reason, "duplicate_clock_in");
}

function testOrphanClockOut() {
  const proposals = planAttendanceVoids([
    {
      id: "x",
      ...employee,
      type: "clock_out",
      timestamp: "2026-07-22T17:00:00.000Z",
    },
  ]);

  assert.equal(proposals.length, 1);
  assert.equal(proposals[0]?.reason, "orphan_event");
}

testDuplicateClockIns();
testOrphanClockOut();
console.log("dedupe-plan: all tests passed");
