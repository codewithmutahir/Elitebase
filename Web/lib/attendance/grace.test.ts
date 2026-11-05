/**
 * Run: npm run test:attendance-grace (from Web/)
 *
 * Covers the resolver: employee override ?? company default ?? 15.
 */
import assert from "node:assert/strict";
import { resolveGraceMinutes } from "./grace";
import { DEFAULT_GRACE_MINUTES } from "./status";

function testEmployeeOverrideWins() {
  assert.equal(
    resolveGraceMinutes({ employeeOverride: 5, companyDefault: 30 }),
    5
  );
}

function testEmployeeOverrideZeroStillWins() {
  // Strict override (0) must not fall through to the company value.
  assert.equal(
    resolveGraceMinutes({ employeeOverride: 0, companyDefault: 30 }),
    0
  );
}

function testCompanyDefaultUsedWhenOverrideNull() {
  assert.equal(
    resolveGraceMinutes({ employeeOverride: null, companyDefault: 30 }),
    30
  );
  assert.equal(
    resolveGraceMinutes({ employeeOverride: undefined, companyDefault: 30 }),
    30
  );
}

function testFallsBackTo15WhenNothingProvided() {
  assert.equal(resolveGraceMinutes({}), DEFAULT_GRACE_MINUTES);
  assert.equal(
    resolveGraceMinutes({ employeeOverride: null, companyDefault: null }),
    DEFAULT_GRACE_MINUTES
  );
  assert.equal(
    resolveGraceMinutes({
      employeeOverride: null,
      companyDefault: undefined,
    }),
    DEFAULT_GRACE_MINUTES
  );
}

function testClampsOutOfRangeValues() {
  assert.equal(
    resolveGraceMinutes({ employeeOverride: 999, companyDefault: 30 }),
    120
  );
  assert.equal(
    resolveGraceMinutes({ employeeOverride: -10, companyDefault: 30 }),
    0
  );
  assert.equal(
    resolveGraceMinutes({ employeeOverride: null, companyDefault: 500 }),
    120
  );
}

function testNonFiniteFallsThrough() {
  // NaN override must not win; company default applies.
  assert.equal(
    resolveGraceMinutes({ employeeOverride: Number.NaN, companyDefault: 30 }),
    30
  );
  // Both non-finite → default 15.
  assert.equal(
    resolveGraceMinutes({
      employeeOverride: Number.NaN,
      companyDefault: Number.POSITIVE_INFINITY,
    }),
    DEFAULT_GRACE_MINUTES
  );
}

const tests = [
  testEmployeeOverrideWins,
  testEmployeeOverrideZeroStillWins,
  testCompanyDefaultUsedWhenOverrideNull,
  testFallsBackTo15WhenNothingProvided,
  testClampsOutOfRangeValues,
  testNonFiniteFallsThrough,
];

for (const test of tests) test();
console.log(`attendance/grace.test.ts: ${tests.length} passed`);
