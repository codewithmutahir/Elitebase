/**
 * Run: npm run test:attendance-status (from Web/)
 *
 * Verifies the grace-margin behaviour of computeAttendanceStatus and
 * normalizeGraceMinutes. Zone-anchored to America/New_York to keep the
 * assertions stable across host locales.
 */
import assert from "node:assert/strict";
import {
  DEFAULT_GRACE_MINUTES,
  computeAttendanceStatus,
  normalizeGraceMinutes,
} from "./status";

const TZ = "America/New_York";

/** 09:00 EST on a date well inside standard time — stable for intl output. */
function nyClockIso(yyyy_mm_dd: string, hh: number, mm: number): string {
  // EST = UTC-5 (not DST), so 09:00 NY on 2026-01-15 = 14:00 UTC.
  const utc = new Date(Date.UTC(
    Number(yyyy_mm_dd.slice(0, 4)),
    Number(yyyy_mm_dd.slice(5, 7)) - 1,
    Number(yyyy_mm_dd.slice(8, 10)),
    hh + 5,
    mm,
    0
  ));
  return utc.toISOString();
}

function testNormalizeGraceMinutes() {
  assert.equal(normalizeGraceMinutes(null), DEFAULT_GRACE_MINUTES);
  assert.equal(normalizeGraceMinutes(undefined), DEFAULT_GRACE_MINUTES);
  assert.equal(normalizeGraceMinutes(Number.NaN), DEFAULT_GRACE_MINUTES);
  assert.equal(normalizeGraceMinutes(0), 0);
  assert.equal(normalizeGraceMinutes(15), 15);
  assert.equal(normalizeGraceMinutes(15.9), 15);
  assert.equal(normalizeGraceMinutes(120), 120);
  assert.equal(normalizeGraceMinutes(-5), 0);
  assert.equal(normalizeGraceMinutes(999), 120);
}

function testDefaultGraceIs15() {
  // 09:14 NY with 15-min default grace → still on time
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 14), "09:00", TZ),
    "on_time"
  );
  // 09:15 NY exactly at the edge → on time (<=)
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 15), "09:00", TZ),
    "on_time"
  );
  // 09:16 NY → late
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 16), "09:00", TZ),
    "late"
  );
}

function testZeroGraceIsStrict() {
  // 09:00 exact → on time
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 0), "09:00", TZ, 0),
    "on_time"
  );
  // 09:01 → late
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 1), "09:00", TZ, 0),
    "late"
  );
}

function testCustomGrace30() {
  // 09:30 NY with 30-min grace → on time
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 30), "09:00", TZ, 30),
    "on_time"
  );
  // 09:31 NY → late
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 31), "09:00", TZ, 30),
    "late"
  );
}

function testNullGraceFallsBackToDefault() {
  // null grace should behave identically to omitting the arg (= 15 min).
  const iso = nyClockIso("2026-01-15", 9, 14);
  assert.equal(
    computeAttendanceStatus(iso, "09:00", TZ, null),
    "on_time"
  );
  assert.equal(
    computeAttendanceStatus(iso, "09:00", TZ, undefined),
    "on_time"
  );
}

function testGraceClampedWhenOutOfRange() {
  // 300-minute grace is clamped to 120 → 11:00 NY becomes late (schedule 09:00 + 120 = 11:00 exactly → on_time, 11:01 → late).
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 11, 0), "09:00", TZ, 300),
    "on_time"
  );
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 11, 1), "09:00", TZ, 300),
    "late"
  );
  // Negative grace clamps to 0 → acts strict.
  assert.equal(
    computeAttendanceStatus(nyClockIso("2026-01-15", 9, 1), "09:00", TZ, -10),
    "late"
  );
}

const tests = [
  testNormalizeGraceMinutes,
  testDefaultGraceIs15,
  testZeroGraceIsStrict,
  testCustomGrace30,
  testNullGraceFallsBackToDefault,
  testGraceClampedWhenOutOfRange,
];

for (const test of tests) test();
console.log(`attendance/status.test.ts: ${tests.length} passed`);
