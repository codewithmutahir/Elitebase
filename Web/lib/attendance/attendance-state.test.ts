/**
 * Run: npm run test:attendance-state (from Web/)
 */
import assert from "node:assert/strict";
import {
  allActionStateMatrix,
  allowedActions,
  deriveState,
  isClockedInForStatus,
  isOnBreakForStatus,
  validateTransition,
} from "./attendance-state";

function testDeriveState() {
  assert.equal(deriveState(null), "out");
  assert.equal(deriveState(undefined), "out");
  assert.equal(deriveState("clock_out"), "out");
  assert.equal(deriveState("clock_in"), "in");
  assert.equal(deriveState("break_end"), "in");
  assert.equal(deriveState("break_start"), "on_break");
  assert.equal(deriveState("unknown"), "out");
}

function testStatusHelpersMatchLegacy() {
  assert.equal(isClockedInForStatus("clock_in"), true);
  assert.equal(isClockedInForStatus("break_end"), true);
  assert.equal(isClockedInForStatus("break_start"), false);
  assert.equal(isClockedInForStatus("clock_out"), false);
  assert.equal(isClockedInForStatus(null), false);

  assert.equal(isOnBreakForStatus("break_start"), true);
  assert.equal(isOnBreakForStatus("clock_in"), false);
}

function testAllowedActions() {
  assert.deepEqual(allowedActions("out"), ["clock_in"]);
  assert.deepEqual(allowedActions("in"), ["clock_out", "break_start"]);
  assert.deepEqual(allowedActions("on_break"), ["break_end"]);
}

function testTransitionMatrix() {
  const expected: Record<string, Record<string, boolean>> = {
    out: {
      clock_in: true,
      clock_out: false,
      break_start: false,
      break_end: false,
    },
    in: {
      clock_in: false,
      clock_out: true,
      break_start: true,
      break_end: false,
    },
    on_break: {
      clock_in: false,
      clock_out: false,
      break_start: false,
      break_end: true,
    },
  };

  for (const row of allActionStateMatrix()) {
    assert.equal(
      row.allowed,
      expected[row.state][row.action],
      `${row.state} + ${row.action}`
    );
    const validation = validateTransition(row.state, row.action);
    assert.equal(validation.ok, row.allowed, `${row.state} validate ${row.action}`);
  }
}

testDeriveState();
testStatusHelpersMatchLegacy();
testAllowedActions();
testTransitionMatrix();

console.log("attendance-state: all tests passed");
