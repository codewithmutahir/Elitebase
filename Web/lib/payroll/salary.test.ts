import assert from "node:assert/strict";
import { monthlySalaryPay } from "@/lib/payroll/salary";

function testFullMonthNoLeave() {
  const pay = monthlySalaryPay({
    salaryAmount: 30000,
    yearMonth: "2026-01",
    workingDays: [1, 2, 3, 4, 5],
    unpaidLeaveRanges: [],
  });
  assert.equal(pay, 30000);
}

function testOneUnpaidWorkingDay() {
  // Jan 2026: Thu 1 is a working day (ISO 4).
  const pay = monthlySalaryPay({
    salaryAmount: 30000,
    yearMonth: "2026-01",
    workingDays: [1, 2, 3, 4, 5],
    unpaidLeaveRanges: [{ start_date: "2026-01-01", end_date: "2026-01-01" }],
  });
  // 22 working days in Jan 2026 Mon–Fri → daily ≈ 1363.636…; one day off.
  const expected = Math.round((30000 - 30000 / 22) * 100) / 100;
  assert.equal(pay, expected);
}

function testUnpaidOnWeekendIgnored() {
  // Jan 4 2026 is Sunday — not a Mon–Fri working day.
  const pay = monthlySalaryPay({
    salaryAmount: 30000,
    yearMonth: "2026-01",
    workingDays: [1, 2, 3, 4, 5],
    unpaidLeaveRanges: [{ start_date: "2026-01-04", end_date: "2026-01-04" }],
  });
  assert.equal(pay, 30000);
}

function testZeroSalary() {
  assert.equal(
    monthlySalaryPay({
      salaryAmount: 0,
      yearMonth: "2026-01",
      workingDays: [1, 2, 3, 4, 5],
      unpaidLeaveRanges: [],
    }),
    0
  );
}

testFullMonthNoLeave();
testOneUnpaidWorkingDay();
testUnpaidOnWeekendIgnored();
testZeroSalary();
console.log("salary.test.ts: ok");
