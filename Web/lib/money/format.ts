import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";

export function getCurrencySymbol(
  currency: string | null | undefined = DEFAULT_CURRENCY
): string {
  const code = resolveCurrency(currency);
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatMoney(
  amount: number,
  currency: string | null | undefined = DEFAULT_CURRENCY
): string {
  const code = resolveCurrency(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatHourlyRate(
  rate: number,
  currency: string | null | undefined = DEFAULT_CURRENCY
): string {
  return `${formatMoney(rate, currency)}/hr`;
}

export function formatMonthlySalary(
  amount: number,
  currency: string | null | undefined = DEFAULT_CURRENCY
): string {
  return `${formatMoney(amount, currency)}/mo`;
}

export function formatWages(
  amount: number,
  currency: string | null | undefined = DEFAULT_CURRENCY
): string {
  return formatMoney(amount, currency);
}
