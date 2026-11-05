import {
  clampNonNegativeCents,
  divideCentsHalfUp,
  multiplyCentsByDays,
  sumCents,
  toCents,
} from "@/lib/money/cents";
import { normalizeWorkingDays, ISO_DAY_LABELS } from "@/lib/employees/working-days";

/**
 * Rounding rule (documented):
 * - All money stored/computed as integer cents.
 * - Per-day salary = floor((baseCents + workingDays/2) / workingDays)  // half-up
 * - Day-based deductions = perDayCents × days (exact integer product)
 * - Net never silently negative: clamped to 0 with `netClamped` warning flag
 */

export type PayslipAllowanceInput = {
  id?: string;
  label: string;
  amountCents: number;
};

export type PayslipLoanInput = {
  id?: string;
  label: string;
  balanceCents: number;
  installmentCents: number;
};

export type PayslipLeaveBalanceInput = {
  sickRemaining: number;
  paidRemaining: number;
  totalRemaining: number;
};

export type PayslipAttendanceInput = {
  /** Distinct late clock-in days in the month (off/leave/holiday already excluded by caller). */
  lateCount: number;
  presentDays: number;
  absentDays: number;
  /** Paid/sick leave working days taken this month (not deducted). */
  paidLeaveDays: number;
  sickLeaveDays: number;
  /** Unpaid / LWP / absent days that deduct salary. */
  unpaidLeaveDays: number;
  offDays: number;
};

export type PayslipAdjustmentInput = {
  label: string;
  /** Positive = earning, negative = deduction (cents). */
  amountCents: number;
};

export type CalculatePayslipInput = {
  employeeName: string;
  employeeId?: string;
  designation?: string | null;
  department?: string | null;
  month: number; // 1–12
  year: number;
  /** ISO working days 1–7 (Mon–Sun). Off days = complement. */
  workingDaysIso: number[];
  /** Company holidays as YYYY-MM-DD (optional; subtracted from working days). */
  holidayDates?: string[];
  baseSalaryMajor: number;
  bonusAccruedMajor?: number;
  bonusPolicyLabel?: string | null;
  leaveBalance: PayslipLeaveBalanceInput;
  attendance: PayslipAttendanceInput;
  allowances: PayslipAllowanceInput[];
  loans: PayslipLoanInput[];
  otherAdjustments?: PayslipAdjustmentInput[];
  /** Default 3 — every N lates = 1 day deduction. */
  latesPerDayDeduction?: number;
  /**
   * Prior-month leftover lates when carry is enabled.
   * Default policy: NO carry (pass 0).
   */
  carriedLateRemainder?: number;
};

export type PayslipLoanResult = {
  id?: string;
  label: string;
  balanceBeforeCents: number;
  deductedCents: number;
  balanceAfterCents: number;
};

export type CalculatePayslipResult = {
  employeeName: string;
  employeeId: string | null;
  designation: string | null;
  department: string | null;
  month: number;
  year: number;
  payPeriodLabel: string;
  leaveBalance: PayslipLeaveBalanceInput;
  dayOffLabel: string;
  calendarDays: number;
  holidayDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  sickLeaveDays: number;
  unpaidLeaveDays: number;
  offDays: number;
  baseSalaryCents: number;
  bonusAccruedCents: number;
  bonusPolicyLabel: string | null;
  salaryPerDayCents: number;
  leaveDeductionCents: number;
  absentDeductionCents: number;
  lateCount: number;
  lateDaysDeducted: number;
  lateRemainder: number;
  lateDeductionCents: number;
  loans: PayslipLoanResult[];
  loanBalanceBeforeCents: number;
  loanDeductionCents: number;
  loanBalanceAfterCents: number;
  allowances: PayslipAllowanceInput[];
  allowancesTotalCents: number;
  otherAdjustments: PayslipAdjustmentInput[];
  otherAdjustmentsCents: number;
  grossCents: number;
  totalDeductionsCents: number;
  netSalaryCents: number;
  /** True when raw net was negative and was clamped to 0. */
  netClamped: boolean;
  warnings: string[];
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function monthName(month: number): string {
  return (
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][month - 1] ?? String(month)
  );
}

/** Off-day ISO labels for the employee's weekly offs (complement of working days). */
export function formatDayOffLabel(workingDaysIso: number[]): string {
  const working = new Set(normalizeWorkingDays(workingDaysIso));
  const offs = [1, 2, 3, 4, 5, 6, 7].filter((d) => !working.has(d));
  if (offs.length === 0) return "None";
  return offs.map((d) => ISO_DAY_LABELS[d] ?? String(d)).join(", ");
}

/**
 * Working days in month = calendar days that match employee working ISO days,
 * minus company holidays that fall on those working days.
 */
export function countPayslipWorkingDays(
  year: number,
  month: number,
  workingDaysIso: number[],
  holidayDates: string[] = []
): { calendarDays: number; workingDays: number; offDays: number; holidayDays: number } {
  const working = normalizeWorkingDays(workingDaysIso);
  const calendarDays = daysInMonth(year, month);
  const holidaySet = new Set(
    holidayDates.filter((d) => {
      const y = Number(d.slice(0, 4));
      const m = Number(d.slice(5, 7));
      return y === year && m === month;
    })
  );

  let workingDays = 0;
  let holidayOnWorking = 0;
  for (let day = 1; day <= calendarDays; day += 1) {
    const date = new Date(year, month - 1, day);
    const pgDay = date.getDay();
    const isoDay = pgDay === 0 ? 7 : pgDay;
    if (!working.includes(isoDay)) continue;
    const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (holidaySet.has(key)) {
      holidayOnWorking += 1;
      continue;
    }
    workingDays += 1;
  }

  const offDays = calendarDays - workingDays - holidayOnWorking;
  return {
    calendarDays,
    workingDays,
    offDays,
    holidayDays: holidayOnWorking,
  };
}

/** Convert late count → whole-day deductions + remainder. Never caps accumulation. */
export function convertLatesToDays(
  lateCount: number,
  latesPerDayDeduction: number
): { days: number; remainder: number } {
  const n = Math.max(0, Math.trunc(lateCount));
  const per = Math.max(1, Math.trunc(latesPerDayDeduction));
  return {
    days: Math.floor(n / per),
    remainder: n % per,
  };
}

/**
 * Pure payslip calculator — server source of truth.
 * Client may preview by calling the same function with server-fetched inputs.
 */
export function calculatePayslip(
  input: CalculatePayslipInput
): CalculatePayslipResult {
  const warnings: string[] = [];
  const month = Math.trunc(input.month);
  const year = Math.trunc(input.year);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    warnings.push("Invalid month/year.");
  }

  const {
    calendarDays,
    workingDays,
    offDays,
    holidayDays,
  } = countPayslipWorkingDays(
    year,
    month,
    input.workingDaysIso,
    input.holidayDates ?? []
  );

  const baseSalaryCents = clampNonNegativeCents(toCents(input.baseSalaryMajor));
  const bonusAccruedCents = clampNonNegativeCents(
    toCents(input.bonusAccruedMajor ?? 0)
  );

  if (baseSalaryCents <= 0) {
    warnings.push("Base salary is missing or zero.");
  }

  let salaryPerDayCents = 0;
  if (workingDays <= 0) {
    warnings.push("Working days is zero — cannot compute per-day salary.");
  } else {
    salaryPerDayCents = divideCentsHalfUp(baseSalaryCents, workingDays);
  }

  const unpaidLeaveDays = Math.max(
    0,
    Math.trunc(input.attendance.unpaidLeaveDays)
  );
  const absentDaysCount = Math.max(0, Math.trunc(input.attendance.absentDays));
  const leaveDeductionCents = multiplyCentsByDays(
    salaryPerDayCents,
    unpaidLeaveDays
  );
  const absentDeductionCents = multiplyCentsByDays(
    salaryPerDayCents,
    absentDaysCount
  );

  const latesPer = Math.max(1, Math.trunc(input.latesPerDayDeduction ?? 3));
  const lateCount =
    Math.max(0, Math.trunc(input.attendance.lateCount)) +
    Math.max(0, Math.trunc(input.carriedLateRemainder ?? 0));
  const { days: lateDaysDeducted, remainder: lateRemainder } =
    convertLatesToDays(lateCount, latesPer);
  const lateDeductionCents = multiplyCentsByDays(
    salaryPerDayCents,
    lateDaysDeducted
  );

  const loans: PayslipLoanResult[] = [];
  for (const loan of input.loans) {
    const balanceBefore = clampNonNegativeCents(loan.balanceCents);
    const installment = clampNonNegativeCents(loan.installmentCents);
    const deducted = Math.min(installment, balanceBefore);
    loans.push({
      id: loan.id,
      label: loan.label,
      balanceBeforeCents: balanceBefore,
      deductedCents: deducted,
      balanceAfterCents: balanceBefore - deducted,
    });
  }
  const loanDeductionCents = sumCents(loans.map((l) => l.deductedCents));
  const loanBalanceBeforeCents = sumCents(loans.map((l) => l.balanceBeforeCents));
  const loanBalanceAfterCents = sumCents(loans.map((l) => l.balanceAfterCents));

  const allowances = input.allowances.map((a) => ({
    ...a,
    amountCents: clampNonNegativeCents(a.amountCents),
  }));
  const allowancesTotalCents = sumCents(allowances.map((a) => a.amountCents));

  const otherAdjustments = (input.otherAdjustments ?? []).map((a) => ({
    label: a.label,
    amountCents: Math.trunc(a.amountCents),
  }));
  const otherAdjustmentsCents = sumCents(
    otherAdjustments.map((a) => a.amountCents)
  );

  const earningsCents =
    baseSalaryCents + bonusAccruedCents + allowancesTotalCents;
  const positiveOther = sumCents(
    otherAdjustments.filter((a) => a.amountCents > 0).map((a) => a.amountCents)
  );
  const negativeOther = sumCents(
    otherAdjustments.filter((a) => a.amountCents < 0).map((a) => -a.amountCents)
  );

  const grossCents = earningsCents + positiveOther;
  const totalDeductionsCents =
    leaveDeductionCents +
    absentDeductionCents +
    lateDeductionCents +
    loanDeductionCents +
    negativeOther;

  const rawNet =
    baseSalaryCents +
    bonusAccruedCents +
    allowancesTotalCents +
    otherAdjustmentsCents -
    leaveDeductionCents -
    absentDeductionCents -
    lateDeductionCents -
    loanDeductionCents;

  const netClamped = rawNet < 0;
  if (netClamped) {
    warnings.push(
      "Net salary would be negative; clamped to 0. Employer confirmation required before publish."
    );
  }
  const netSalaryCents = netClamped ? 0 : rawNet;

  return {
    employeeName: input.employeeName,
    employeeId: input.employeeId ?? null,
    designation: input.designation ?? null,
    department: input.department ?? null,
    month,
    year,
    payPeriodLabel: `${monthName(month)} ${year}`,
    leaveBalance: input.leaveBalance,
    dayOffLabel: formatDayOffLabel(input.workingDaysIso),
    calendarDays,
    holidayDays,
    workingDays,
    presentDays: Math.max(0, Math.trunc(input.attendance.presentDays)),
    absentDays: absentDaysCount,
    paidLeaveDays: Math.max(0, Math.trunc(input.attendance.paidLeaveDays)),
    sickLeaveDays: Math.max(0, Math.trunc(input.attendance.sickLeaveDays)),
    unpaidLeaveDays,
    offDays,
    baseSalaryCents,
    bonusAccruedCents,
    bonusPolicyLabel: input.bonusPolicyLabel ?? null,
    salaryPerDayCents,
    leaveDeductionCents,
    absentDeductionCents,
    lateCount: Math.max(0, Math.trunc(input.attendance.lateCount)),
    lateDaysDeducted,
    lateRemainder,
    lateDeductionCents,
    loans,
    loanBalanceBeforeCents,
    loanDeductionCents,
    loanBalanceAfterCents,
    allowances,
    allowancesTotalCents,
    otherAdjustments,
    otherAdjustmentsCents,
    grossCents,
    totalDeductionsCents,
    netSalaryCents,
    netClamped,
    warnings,
  };
}
