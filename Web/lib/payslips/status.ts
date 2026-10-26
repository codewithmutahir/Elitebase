export const PAYSLIP_STATUSES = [
  "draft",
  "reviewed",
  "approved",
  "published",
] as const;

export type PayslipStatus = (typeof PAYSLIP_STATUSES)[number];

export function isPayslipStatus(value: unknown): value is PayslipStatus {
  return (
    value === "draft" ||
    value === "reviewed" ||
    value === "approved" ||
    value === "published"
  );
}

export function formatPayslipStatus(status: PayslipStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "reviewed":
      return "Reviewed";
    case "approved":
      return "Approved";
    case "published":
      return "Published";
  }
}

/** Employee portal may only see published slips. */
export function isEmployeeVisibleStatus(status: PayslipStatus): boolean {
  return status === "published";
}
