import assert from "node:assert/strict";
import {
  calculatePayslip,
  convertLatesToDays,
  countPayslipWorkingDays,
  formatDayOffLabel,
} from "@/lib/payslips/calculate";
import { fromCents } from "@/lib/money/cents";

function baseInput(
  overrides: Partial<Parameters<typeof calculatePayslip>[0]> = {}
): Parameters<typeof calculatePayslip>[0] {
  return {
    employeeName: "Mutahir",
    month: 10,
    year: 2026,
    workingDaysIso: [1, 2, 3, 4, 5, 6], // Sunday off
    baseSalaryMajor: 50000,
    bonusAccruedMajor: 0,
    bonusPolicyLabel: "Six monthly",
    leaveBalance: {
      sickRemaining: 5,
      paidRemaining: 0,
      totalRemaining: 5,
    },
    attendance: {
      lateCount: 5,
      presentDays: 20,
      absentDays: 0,
      paidLeaveDays: 0,
      sickLeaveDays: 0,
      unpaidLeaveDays: 0,
      offDays: 4,
    },
    allowances: [{ label: "Allowances", amountCents: 1_200_000 }],
    loans: [
      {
        label: "Loan",
        balanceCents: 1_800_000,
        installmentCents: 900_000,
      },
    ],
    latesPerDayDeduction: 3,
    ...overrides,
  };
}

function testLateConversion() {
  for (let n = 0; n <= 10; n += 1) {
    const { days, remainder } = convertLatesToDays(n, 3);
    assert.equal(days, Math.floor(n / 3));
    assert.equal(remainder, n % 3);
  }
  // 3→1, 4→1 (+1), 6→2, 7→2 (+1)
  assert.deepEqual(convertLatesToDays(3, 3), { days: 1, remainder: 0 });
  assert.deepEqual(convertLatesToDays(4, 3), { days: 1, remainder: 1 });
  assert.deepEqual(convertLatesToDays(6, 3), { days: 2, remainder: 0 });
  assert.deepEqual(convertLatesToDays(7, 3), { days: 2, remainder: 1 });
}

function testWorkingDaysSundayOffOctober2026() {
  // Oct 2026 has 31 days, 4 Sundays → 27 working if Mon–Sat
  const r = countPayslipWorkingDays(2026, 10, [1, 2, 3, 4, 5, 6]);
  assert.equal(r.calendarDays, 31);
  assert.equal(r.workingDays, 27);
  assert.equal(formatDayOffLabel([1, 2, 3, 4, 5, 6]), "Sun");
}

function testWorkingDaysMonFriJanuary2026() {
  const r = countPayslipWorkingDays(2026, 1, [1, 2, 3, 4, 5]);
  assert.equal(r.workingDays, 22);
}

function testHolidaySubtracted() {
  const r = countPayslipWorkingDays(2026, 1, [1, 2, 3, 4, 5], [
    "2026-01-01", // Thursday
  ]);
  assert.equal(r.workingDays, 21);
  assert.equal(r.holidayDays, 1);
}

function testLeaveExhaustionUnpaidDeduction() {
  const result = calculatePayslip(
    baseInput({
      attendance: {
        lateCount: 0,
        presentDays: 20,
        absentDays: 0,
        paidLeaveDays: 0,
        sickLeaveDays: 0,
        unpaidLeaveDays: 2,
        offDays: 4,
      },
      loans: [],
      allowances: [],
      workingDaysIso: [1, 2, 3, 4, 5, 6],
    })
  );
  // 27 working days → per day = round(50000/27)
  const perDay = Math.round((50000 / 27) * 100); // compare via cents from engine
  assert.equal(result.workingDays, 27);
  assert.equal(result.salaryPerDayCents, Math.floor((5_000_000 + 13) / 27));
  assert.equal(result.leaveDeductionCents, result.salaryPerDayCents * 2);
  assert.ok(result.leaveDeductionCents > 0);
  void perDay;
}

function testLoanClamp() {
  const result = calculatePayslip(
    baseInput({
      attendance: {
        lateCount: 0,
        presentDays: 22,
        absentDays: 0,
        paidLeaveDays: 0,
        sickLeaveDays: 0,
        unpaidLeaveDays: 0,
        offDays: 4,
      },
      loans: [
        {
          label: "Loan",
          balanceCents: 500_00,
          installmentCents: 900_00,
        },
      ],
      allowances: [],
    })
  );
  assert.equal(result.loanDeductionCents, 500_00);
  assert.equal(result.loanBalanceAfterCents, 0);
}

function testLateDeductionFiveLates() {
  const result = calculatePayslip(
    baseInput({
      loans: [],
      allowances: [],
      attendance: {
        lateCount: 5,
        presentDays: 22,
        absentDays: 0,
        paidLeaveDays: 0,
        sickLeaveDays: 0,
        unpaidLeaveDays: 0,
        offDays: 4,
      },
    })
  );
  // 5 lates / 3 = 1 day + 2 remainder
  assert.equal(result.lateDaysDeducted, 1);
  assert.equal(result.lateRemainder, 2);
  assert.equal(result.lateDeductionCents, result.salaryPerDayCents);
}

function testNetNeverNegativeSilent() {
  const result = calculatePayslip(
    baseInput({
      baseSalaryMajor: 100,
      allowances: [],
      loans: [
        {
          label: "Loan",
          balanceCents: 50_000_00,
          installmentCents: 50_000_00,
        },
      ],
      attendance: {
        lateCount: 0,
        presentDays: 0,
        absentDays: 0,
        paidLeaveDays: 0,
        sickLeaveDays: 0,
        unpaidLeaveDays: 0,
        offDays: 4,
      },
    })
  );
  assert.equal(result.netSalaryCents, 0);
  assert.equal(result.netClamped, true);
  assert.ok(result.warnings.some((w) => w.includes("negative")));
}

function testZeroWorkingDaysGuard() {
  // Impossible working days array that somehow yields 0 — use holiday wiping all
  // Actually empty working days normalize to Mon–Fri. Force via all holidays on
  // a tiny month isn't easy. Call divide path via leap Feb with all days holiday.
  const days = countPayslipWorkingDays(2024, 2, [1, 2, 3, 4, 5], [
    // mark every weekday as holiday — build list
    ...Array.from({ length: 29 }, (_, i) => {
      const d = i + 1;
      return `2024-02-${String(d).padStart(2, "0")}`;
    }),
  ]);
  assert.equal(days.workingDays, 0);

  const result = calculatePayslip(
    baseInput({
      month: 2,
      year: 2024,
      workingDaysIso: [1, 2, 3, 4, 5],
      holidayDates: Array.from({ length: 29 }, (_, i) => {
        const d = i + 1;
        return `2024-02-${String(d).padStart(2, "0")}`;
      }),
      loans: [],
      allowances: [],
    })
  );
  assert.equal(result.workingDays, 0);
  assert.equal(result.salaryPerDayCents, 0);
  assert.ok(result.warnings.some((w) => w.includes("Working days is zero")));
}

function testExcelStyleNetRough() {
  // Mirror spreadsheet: salary 50k, allowances 12k, loan 9k, 5 lates → 1 day,
  // leave deduction ~2 days unpaid. Working days with Sun off in Oct.
  const result = calculatePayslip(
    baseInput({
      attendance: {
        lateCount: 5,
        presentDays: 20,
        absentDays: 0,
        paidLeaveDays: 0,
        sickLeaveDays: 0,
        unpaidLeaveDays: 2,
        offDays: 4,
      },
    })
  );
  const netMajor = fromCents(result.netSalaryCents);
  // Spreadsheet showed 47,074 with 26 working days; we compute 27 for Oct 2026
  // Mon–Sat. Assert structure, not exact Excel day count mismatch.
  assert.ok(netMajor > 0);
  assert.equal(result.allowancesTotalCents, 1_200_000);
  assert.equal(result.loanDeductionCents, 900_000);
  assert.equal(result.lateDaysDeducted, 1);
}

const tests = [
  testLateConversion,
  testWorkingDaysSundayOffOctober2026,
  testWorkingDaysMonFriJanuary2026,
  testHolidaySubtracted,
  testLeaveExhaustionUnpaidDeduction,
  testLoanClamp,
  testLateDeductionFiveLates,
  testNetNeverNegativeSilent,
  testZeroWorkingDaysGuard,
  testExcelStyleNetRough,
];

for (const test of tests) test();
console.log(`payslips/calculate.test.ts: ${tests.length} passed`);
