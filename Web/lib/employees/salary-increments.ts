import type { PayType } from "@/lib/employees/profile-queries";

export type SalaryIncrementKind =
  | "raise"
  | "adjustment"
  | "promotion"
  | "correction";

export type SalaryIncrement = {
  id: string;
  employee_id: string;
  company_id: string;
  effective_date: string;
  pay_type: PayType;
  previous_amount: number;
  new_amount: number;
  increment_amount: number;
  kind: SalaryIncrementKind;
  reason: string | null;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
};

export const SALARY_INCREMENT_KINDS: SalaryIncrementKind[] = [
  "raise",
  "adjustment",
  "promotion",
  "correction",
];

export function formatIncrementKind(kind: SalaryIncrementKind): string {
  switch (kind) {
    case "raise":
      return "Raise";
    case "adjustment":
      return "Adjustment";
    case "promotion":
      return "Promotion";
    case "correction":
      return "Correction";
    default:
      return kind;
  }
}

export function normalizeIncrementKind(
  value: string | null | undefined
): SalaryIncrementKind {
  if (
    value === "raise" ||
    value === "adjustment" ||
    value === "promotion" ||
    value === "correction"
  ) {
    return value;
  }
  return "raise";
}

/** Current pay amount for the employee's active pay type. */
export function currentPayAmount(employee: {
  pay_type: PayType;
  salary_amount: number | null;
  hourly_rate: number;
}): number {
  if (employee.pay_type === "salary") {
    return Number(employee.salary_amount ?? 0);
  }
  return Number(employee.hourly_rate ?? 0);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
