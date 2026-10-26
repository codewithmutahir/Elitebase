/**
 * Integer minor-unit helpers for payroll math.
 * Never use floating-point for money arithmetic — convert to cents first.
 */

/** Round a major-unit number to cents using half-up (commercial rounding). */
export function toCents(amountMajor: number): number {
  if (!Number.isFinite(amountMajor)) return 0;
  return Math.round(amountMajor * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/** Half-up division of cents by a positive divisor (e.g. per-day rate). */
export function divideCentsHalfUp(numeratorCents: number, divisor: number): number {
  if (!Number.isFinite(numeratorCents) || !Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }
  // (n + d/2) / d with integer math
  return Math.floor((Math.trunc(numeratorCents) + Math.floor(divisor / 2)) / divisor);
}

export function multiplyCentsByDays(centsPerDay: number, days: number): number {
  const d = Math.max(0, days);
  return Math.trunc(centsPerDay) * d;
}

export function clampNonNegativeCents(cents: number): number {
  return Math.max(0, Math.trunc(cents));
}

export function sumCents(values: number[]): number {
  let total = 0;
  for (const v of values) total += Math.trunc(v);
  return total;
}
