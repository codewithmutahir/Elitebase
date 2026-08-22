export type CurrencyOption = {
  value: string;
  label: string;
};

/** Shown first in the settings selector. */
export const POPULAR_CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "PKR",
  "INR",
  "AED",
  "SAR",
  "BRL",
  "MXN",
  "JPY",
  "CNY",
  "SGD",
  "NZD",
  "ZAR",
  "TRY",
  "PHP",
  "BDT",
  "NGN",
] as const;

const CURRENCY_NAMES: Record<string, string> = {
  AED: "UAE Dirham",
  AFN: "Afghan Afghani",
  ALL: "Albanian Lek",
  AMD: "Armenian Dram",
  ARS: "Argentine Peso",
  AUD: "Australian Dollar",
  AZN: "Azerbaijani Manat",
  BDT: "Bangladeshi Taka",
  BGN: "Bulgarian Lev",
  BHD: "Bahraini Dinar",
  BND: "Brunei Dollar",
  BOB: "Bolivian Boliviano",
  BRL: "Brazilian Real",
  BWP: "Botswana Pula",
  BYN: "Belarusian Ruble",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CLP: "Chilean Peso",
  CNY: "Chinese Yuan",
  COP: "Colombian Peso",
  CRC: "Costa Rican Colón",
  CZK: "Czech Koruna",
  DKK: "Danish Krone",
  DOP: "Dominican Peso",
  DZD: "Algerian Dinar",
  EGP: "Egyptian Pound",
  ETB: "Ethiopian Birr",
  EUR: "Euro",
  FJD: "Fijian Dollar",
  GBP: "British Pound",
  GEL: "Georgian Lari",
  GHS: "Ghanaian Cedi",
  GTQ: "Guatemalan Quetzal",
  HKD: "Hong Kong Dollar",
  HNL: "Honduran Lempira",
  HRK: "Croatian Kuna",
  HUF: "Hungarian Forint",
  IDR: "Indonesian Rupiah",
  ILS: "Israeli Shekel",
  INR: "Indian Rupee",
  IQD: "Iraqi Dinar",
  IRR: "Iranian Rial",
  ISK: "Icelandic Króna",
  JMD: "Jamaican Dollar",
  JOD: "Jordanian Dinar",
  JPY: "Japanese Yen",
  KES: "Kenyan Shilling",
  KHR: "Cambodian Riel",
  KRW: "South Korean Won",
  KWD: "Kuwaiti Dinar",
  KZT: "Kazakhstani Tenge",
  LBP: "Lebanese Pound",
  LKR: "Sri Lankan Rupee",
  MAD: "Moroccan Dirham",
  MMK: "Myanmar Kyat",
  MNT: "Mongolian Tögrög",
  MOP: "Macanese Pataca",
  MUR: "Mauritian Rupee",
  MVR: "Maldivian Rufiyaa",
  MXN: "Mexican Peso",
  MYR: "Malaysian Ringgit",
  NGN: "Nigerian Naira",
  NOK: "Norwegian Krone",
  NPR: "Nepalese Rupee",
  NZD: "New Zealand Dollar",
  OMR: "Omani Rial",
  PEN: "Peruvian Sol",
  PHP: "Philippine Peso",
  PKR: "Pakistani Rupee",
  PLN: "Polish Złoty",
  QAR: "Qatari Riyal",
  RON: "Romanian Leu",
  RSD: "Serbian Dinar",
  RUB: "Russian Ruble",
  SAR: "Saudi Riyal",
  SEK: "Swedish Krona",
  SGD: "Singapore Dollar",
  THB: "Thai Baht",
  TND: "Tunisian Dinar",
  TRY: "Turkish Lira",
  TTD: "Trinidad & Tobago Dollar",
  TWD: "New Taiwan Dollar",
  TZS: "Tanzanian Shilling",
  UAH: "Ukrainian Hryvnia",
  UGX: "Ugandan Shilling",
  USD: "US Dollar",
  UYU: "Uruguayan Peso",
  UZS: "Uzbekistani Som",
  VND: "Vietnamese Dong",
  XAF: "Central African CFA Franc",
  XOF: "West African CFA Franc",
  ZAR: "South African Rand",
  ZMW: "Zambian Kwacha",
};

export const DEFAULT_CURRENCY = "USD";

export const ALL_CURRENCIES: CurrencyOption[] = Object.entries(CURRENCY_NAMES)
  .map(([value, name]) => ({
    value,
    label: `${name} (${value})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

const currencyCodeSet = new Set(ALL_CURRENCIES.map((currency) => currency.value));

export const POPULAR_CURRENCIES: CurrencyOption[] = POPULAR_CURRENCY_CODES.map(
  (code) => {
    const match = ALL_CURRENCIES.find((currency) => currency.value === code);
    return match ?? { value: code, label: `${code}` };
  }
);

export function isValidCurrency(code: string): boolean {
  return currencyCodeSet.has(code.toUpperCase());
}

export function resolveCurrency(code: string | null | undefined): string {
  const normalized = code?.trim().toUpperCase();
  if (normalized && isValidCurrency(normalized)) {
    return normalized;
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencyLabel(code: string): string {
  const normalized = resolveCurrency(code);
  return (
    ALL_CURRENCIES.find((currency) => currency.value === normalized)?.label ??
    normalized
  );
}
