export type BonusPolicy = "quarterly" | "six_monthly" | "annual";

export const BONUS_POLICIES: readonly BonusPolicy[] = [
  "quarterly",
  "six_monthly",
  "annual",
] as const;

export const DEFAULT_BONUS_POLICY: BonusPolicy = "six_monthly";

const POLICY_MONTHS: Record<BonusPolicy, 3 | 6 | 12> = {
  quarterly: 3,
  six_monthly: 6,
  annual: 12,
};

export function isBonusPolicy(value: unknown): value is BonusPolicy {
  return (
    value === "quarterly" ||
    value === "six_monthly" ||
    value === "annual"
  );
}

export function normalizeBonusPolicy(value: unknown): BonusPolicy {
  return isBonusPolicy(value) ? value : DEFAULT_BONUS_POLICY;
}

export function policyMonths(policy: BonusPolicy): 3 | 6 | 12 {
  return POLICY_MONTHS[policy];
}

export function formatBonusPolicyLabel(policy: BonusPolicy): string {
  switch (policy) {
    case "quarterly":
      return "Quarterly";
    case "six_monthly":
      return "Six monthly";
    case "annual":
      return "Annual";
  }
}

export function normalizeCycleStartMonth(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 12) return 1;
  return n;
}

/** Month of hire_date (1–12), or 1 when missing/invalid. */
export function cycleStartFromHireDate(hireDate: string | null | undefined): number {
  if (!hireDate || !/^\d{4}-\d{2}-\d{2}/.test(hireDate)) return 1;
  const month = Number(hireDate.slice(5, 7));
  return normalizeCycleStartMonth(month);
}

export function parseYearMonth(yearMonth: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return null;
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  if (!year || month < 1 || month > 12) return null;
  return { year, month };
}

/** Absolute month index from an arbitrary epoch (year*12 + month). */
function absoluteMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

export type CyclePosition = {
  /** 1-based position within the current cycle. */
  monthInCycle: number;
  isPayoutMonth: boolean;
  policyMonths: number;
  /** Inclusive YYYY-MM of cycle start. */
  cycleStartYearMonth: string;
  /** Inclusive YYYY-MM of cycle end (payout month). */
  cycleEndYearMonth: string;
  cycleLabel: string;
};

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonths(year: number, month: number, delta: number): {
  year: number;
  month: number;
} {
  const idx = absoluteMonthIndex(year, month) + delta;
  return {
    year: Math.floor(idx / 12),
    month: (idx % 12) + 1,
  };
}

/**
 * Resolve where `yearMonth` sits in repeating cycles that start on
 * `cycleStartMonth` each year (then every `policyMonths` thereafter).
 *
 * Example: cycleStartMonth=1, policy=6 → Jan–Jun, Jul–Dec.
 * Example: cycleStartMonth=3, policy=6 → Mar–Aug, Sep–Feb, …
 */
export function resolveCycle(
  yearMonth: string,
  cycleStartMonth: number,
  policy: BonusPolicy
): CyclePosition | null {
  const parsed = parseYearMonth(yearMonth);
  if (!parsed) return null;

  const months = policyMonths(policy);
  const startMonth = normalizeCycleStartMonth(cycleStartMonth);

  // Anchor: first cycle start on or before the target month in a stable timeline.
  // Use year of target, then walk back by full cycles from the nearest start.
  const targetIdx = absoluteMonthIndex(parsed.year, parsed.month);
  // Find a start in the same calendar year first, then adjust.
  let startYear = parsed.year;
  let startIdx = absoluteMonthIndex(startYear, startMonth);
  if (startIdx > targetIdx) {
    startYear -= 1;
    startIdx = absoluteMonthIndex(startYear, startMonth);
  }

  const offset = targetIdx - startIdx;
  const cycleIndex = Math.floor(offset / months);
  const monthInCycle = (offset % months) + 1;

  const cycleStart = addMonths(startYear, startMonth, cycleIndex * months);
  const cycleEnd = addMonths(cycleStart.year, cycleStart.month, months - 1);
  const cycleStartYearMonth = formatYearMonth(cycleStart.year, cycleStart.month);
  const cycleEndYearMonth = formatYearMonth(cycleEnd.year, cycleEnd.month);

  return {
    monthInCycle,
    isPayoutMonth: monthInCycle === months,
    policyMonths: months,
    cycleStartYearMonth,
    cycleEndYearMonth,
    cycleLabel: `${cycleStartYearMonth} → ${cycleEndYearMonth}`,
  };
}

export function bonusSlice(bonusAmount: number, policy: BonusPolicy): number {
  const amount = Math.max(0, Number(bonusAmount) || 0);
  if (amount <= 0) return 0;
  const months = policyMonths(policy);
  return Math.round((amount / months) * 100) / 100;
}

export function accruedBonus(
  bonusAmount: number,
  policy: BonusPolicy,
  monthInCycle: number
): number {
  const slice = bonusSlice(bonusAmount, policy);
  const months = policyMonths(policy);
  const clamped = Math.min(Math.max(1, monthInCycle), months);
  // Prefer exact full amount on final month to avoid float drift.
  if (clamped === months) {
    return Math.round(Math.max(0, Number(bonusAmount) || 0) * 100) / 100;
  }
  return Math.round(slice * clamped * 100) / 100;
}

export function bonusDueThisMonth(
  bonusAmount: number,
  policy: BonusPolicy,
  yearMonth: string,
  cycleStartMonth: number
): number {
  const cycle = resolveCycle(yearMonth, cycleStartMonth, policy);
  if (!cycle || !cycle.isPayoutMonth) return 0;
  return Math.round(Math.max(0, Number(bonusAmount) || 0) * 100) / 100;
}

export type BonusMonthRow = {
  yearMonth: string;
  monthInCycle: number;
  isPayoutMonth: boolean;
  cycleLabel: string;
  salaryPay: number;
  /** Cumulative accrued bonus through this month in the cycle. */
  accruedBalance: number;
  /** Cash bonus paid this month (full amount on payout month only). */
  bonusDue: number;
  totalDue: number;
};

export function buildBonusMonthRow(input: {
  yearMonth: string;
  salaryPay: number;
  bonusAmount: number;
  policy: BonusPolicy;
  cycleStartMonth: number;
}): BonusMonthRow | null {
  const cycle = resolveCycle(
    input.yearMonth,
    input.cycleStartMonth,
    input.policy
  );
  if (!cycle) return null;

  const salaryPay = Math.round((Number(input.salaryPay) || 0) * 100) / 100;
  const accruedBalance = accruedBonus(
    input.bonusAmount,
    input.policy,
    cycle.monthInCycle
  );
  const bonusDue = cycle.isPayoutMonth
    ? Math.round(Math.max(0, Number(input.bonusAmount) || 0) * 100) / 100
    : 0;
  const totalDue = Math.round((salaryPay + bonusDue) * 100) / 100;

  return {
    yearMonth: input.yearMonth,
    monthInCycle: cycle.monthInCycle,
    isPayoutMonth: cycle.isPayoutMonth,
    cycleLabel: cycle.cycleLabel,
    salaryPay,
    accruedBalance,
    bonusDue,
    totalDue,
  };
}

/** List YYYY-MM keys for a calendar year (Jan–Dec). */
export function yearMonthKeys(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    formatYearMonth(year, i + 1)
  );
}

/**
 * Sum policy-aware bonus due for each distinct calendar month in `dates`
 * (typically timesheet row dates). Pays once per payout month.
 */
export function bonusDueForDateSet(
  dates: Iterable<string>,
  bonusAmount: number,
  policy: BonusPolicy,
  cycleStartMonth: number
): number {
  const months = new Set<string>();
  for (const date of dates) {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      months.add(date.slice(0, 7));
    } else if (/^\d{4}-\d{2}$/.test(date)) {
      months.add(date);
    }
  }

  let total = 0;
  for (const yearMonth of months) {
    total += bonusDueThisMonth(
      bonusAmount,
      policy,
      yearMonth,
      cycleStartMonth
    );
  }
  return Math.round(total * 100) / 100;
}

/** Next payout YYYY-MM on or after `fromYearMonth` (inclusive). */
export function nextPayoutYearMonth(
  fromYearMonth: string,
  cycleStartMonth: number,
  policy: BonusPolicy
): string | null {
  const parsed = parseYearMonth(fromYearMonth);
  if (!parsed) return null;
  for (let i = 0; i < policyMonths(policy) + 1; i += 1) {
    const { year, month } = addMonths(parsed.year, parsed.month, i);
    const key = formatYearMonth(year, month);
    const cycle = resolveCycle(key, cycleStartMonth, policy);
    if (cycle?.isPayoutMonth) return key;
  }
  return null;
}
