import assert from "node:assert/strict";
import {
  accruedBonus,
  bonusDueForDateSet,
  bonusDueThisMonth,
  bonusSlice,
  buildBonusMonthRow,
  cycleStartFromHireDate,
  nextPayoutYearMonth,
  resolveCycle,
} from "@/lib/payroll/bonus";

function testSixMonthlyCalendar() {
  const jan = resolveCycle("2026-01", 1, "six_monthly");
  assert.ok(jan);
  assert.equal(jan.monthInCycle, 1);
  assert.equal(jan.isPayoutMonth, false);
  assert.equal(jan.cycleStartYearMonth, "2026-01");
  assert.equal(jan.cycleEndYearMonth, "2026-06");

  const jun = resolveCycle("2026-06", 1, "six_monthly");
  assert.ok(jun);
  assert.equal(jun.monthInCycle, 6);
  assert.equal(jun.isPayoutMonth, true);

  const jul = resolveCycle("2026-07", 1, "six_monthly");
  assert.ok(jul);
  assert.equal(jul.monthInCycle, 1);
  assert.equal(jul.cycleEndYearMonth, "2026-12");
}

function testHireMonthCycle() {
  // Hire in March → Mar–Aug, Sep–Feb
  const mar = resolveCycle("2026-03", 3, "six_monthly");
  assert.ok(mar);
  assert.equal(mar.monthInCycle, 1);
  assert.equal(mar.cycleEndYearMonth, "2026-08");

  const aug = resolveCycle("2026-08", 3, "six_monthly");
  assert.ok(aug);
  assert.equal(aug.isPayoutMonth, true);

  const sep = resolveCycle("2026-09", 3, "six_monthly");
  assert.ok(sep);
  assert.equal(sep.monthInCycle, 1);
  assert.equal(sep.cycleEndYearMonth, "2027-02");

  const feb = resolveCycle("2027-02", 3, "six_monthly");
  assert.ok(feb);
  assert.equal(feb.isPayoutMonth, true);
}

function testExcelAccrualAndPayout() {
  assert.equal(bonusSlice(30000, "six_monthly"), 5000);
  assert.equal(accruedBonus(30000, "six_monthly", 1), 5000);
  assert.equal(accruedBonus(30000, "six_monthly", 5), 25000);
  assert.equal(accruedBonus(30000, "six_monthly", 6), 30000);

  assert.equal(bonusDueThisMonth(30000, "six_monthly", "2026-01", 1), 0);
  assert.equal(bonusDueThisMonth(30000, "six_monthly", "2026-06", 1), 30000);

  const jan = buildBonusMonthRow({
    yearMonth: "2026-01",
    salaryPay: 29000,
    bonusAmount: 30000,
    policy: "six_monthly",
    cycleStartMonth: 1,
  });
  assert.ok(jan);
  assert.equal(jan.salaryPay, 29000);
  assert.equal(jan.accruedBalance, 5000);
  assert.equal(jan.bonusDue, 0);
  assert.equal(jan.totalDue, 29000);

  const jun = buildBonusMonthRow({
    yearMonth: "2026-06",
    salaryPay: 30000,
    bonusAmount: 30000,
    policy: "six_monthly",
    cycleStartMonth: 1,
  });
  assert.ok(jun);
  assert.equal(jun.bonusDue, 30000);
  assert.equal(jun.totalDue, 60000);
}

function testQuarterlyAndAnnual() {
  assert.equal(bonusSlice(9000, "quarterly"), 3000);
  const q3 = resolveCycle("2026-03", 1, "quarterly");
  assert.ok(q3);
  assert.equal(q3.isPayoutMonth, true);

  const annual = resolveCycle("2026-12", 1, "annual");
  assert.ok(annual);
  assert.equal(annual.monthInCycle, 12);
  assert.equal(annual.isPayoutMonth, true);
}

function testExportDateSet() {
  const due = bonusDueForDateSet(
    ["2026-01-15", "2026-06-01", "2026-06-20", "2026-07-01"],
    30000,
    "six_monthly",
    1
  );
  // Only June is a payout month in this set.
  assert.equal(due, 30000);
}

function testHelpers() {
  assert.equal(cycleStartFromHireDate("2026-03-15"), 3);
  assert.equal(cycleStartFromHireDate(null), 1);
  assert.equal(nextPayoutYearMonth("2026-01", 1, "six_monthly"), "2026-06");
  assert.equal(nextPayoutYearMonth("2026-06", 1, "six_monthly"), "2026-06");
}

testSixMonthlyCalendar();
testHireMonthCycle();
testExcelAccrualAndPayout();
testQuarterlyAndAnnual();
testExportDateSet();
testHelpers();

console.log("bonus.test.ts: ok");
