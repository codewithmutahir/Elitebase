/**
 * Run: npm run test:stale-shift (from Web/)
 */
import assert from "node:assert/strict";
import {
  DEFAULT_STALE_SHIFT_HOURS,
  isStaleOpenShift,
  shouldAllowStaleClockIn,
} from "./stale-shift";

const base = new Date("2026-09-30T12:00:00.000Z");

function testBoundary() {
  const hours = 16;
  const justUnder = new Date(base.getTime() - hours * 3600 * 1000 + 1000);
  const justOver = new Date(base.getTime() - hours * 3600 * 1000 - 1000);

  assert.equal(isStaleOpenShift(justUnder.toISOString(), hours, base), false);
  assert.equal(isStaleOpenShift(justOver.toISOString(), hours, base), true);
}

function testStaleClockInGate() {
  const staleTs = new Date(base.getTime() - 17 * 3600 * 1000).toISOString();
  const freshTs = new Date(base.getTime() - 1 * 3600 * 1000).toISOString();

  assert.equal(
    shouldAllowStaleClockIn("in", "clock_in", staleTs, DEFAULT_STALE_SHIFT_HOURS, base),
    true
  );
  assert.equal(
    shouldAllowStaleClockIn("in", "clock_in", freshTs, DEFAULT_STALE_SHIFT_HOURS, base),
    false
  );
  assert.equal(
    shouldAllowStaleClockIn("on_break", "clock_in", staleTs, DEFAULT_STALE_SHIFT_HOURS, base),
    true
  );
  assert.equal(
    shouldAllowStaleClockIn("in", "clock_out", staleTs, DEFAULT_STALE_SHIFT_HOURS, base),
    false
  );
}

testBoundary();
testStaleClockInGate();
console.log("stale-shift: all tests passed");
