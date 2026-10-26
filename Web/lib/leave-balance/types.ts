import type { TimeOffRequestType } from "@/lib/time-off/queries";

export type LeaveYearType = "calendar" | "anniversary";
export type LeaveBucket = "sick" | "paid" | "lwp";
export type LeaveBalanceField = "total" | "used";

export type LeavePolicy = {
  sickTotalDefault: number;
  paidTotalDefault: number;
  yearType: LeaveYearType;
  prorateMidYear: boolean;
};

export type LeaveBalanceRow = {
  id: string;
  company_id: string;
  employee_id: string;
  year: number;
  sick_total: number;
  sick_used: number;
  paid_total: number;
  paid_used: number;
};

export type LeaveBalanceView = {
  employeeId?: string;
  year: number;
  sickTotal: number;
  sickUsed: number;
  sickRemaining: number;
  paidTotal: number;
  paidUsed: number;
  paidRemaining: number;
  totalAllotted: number;
  totalUsed: number;
  totalRemaining: number;
};

export type YearDaySlice = {
  year: number;
  days: number;
};

/** Maps request types onto sick / paid / unpaid (LWP) buckets. */
export function balanceBucketForRequestType(
  type: TimeOffRequestType
): "sick" | "paid" | "unpaid" {
  if (type === "sick") return "sick";
  if (type === "unpaid" || type === "unpaid_leave") return "unpaid";
  return "paid";
}

export function toLeaveBalanceView(row: LeaveBalanceRow): LeaveBalanceView {
  const sickRemaining = Math.max(0, row.sick_total - row.sick_used);
  const paidRemaining = Math.max(0, row.paid_total - row.paid_used);
  return {
    employeeId: row.employee_id,
    year: row.year,
    sickTotal: row.sick_total,
    sickUsed: row.sick_used,
    sickRemaining,
    paidTotal: row.paid_total,
    paidUsed: row.paid_used,
    paidRemaining,
    totalAllotted: row.sick_total + row.paid_total,
    totalUsed: row.sick_used + row.paid_used,
    totalRemaining: sickRemaining + paidRemaining,
  };
}
