import { createClient } from "@/lib/supabase/server";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import { resolveGraceMinutes } from "@/lib/attendance/grace";
import { formatShiftTimeRange } from "@/lib/schedules/format";
import { timesheetShiftWages } from "@/lib/schedules/wages";
import { normalizeWorkingDays } from "@/lib/employees/working-days";
import {
  bonusDueForDateSet,
  normalizeBonusPolicy,
  normalizeCycleStartMonth,
  type BonusPolicy,
} from "@/lib/payroll/bonus";
import {
  isDateOnApprovedTimeOff,
  listApprovedTimeOffForRange,
  listApprovedUnpaidLeaveForRange,
} from "@/lib/time-off/queries";
import { isWorkingDayOnDate } from "@/lib/employees/working-days";
import { getAllTimesheetRows } from "@/lib/timesheets/data";
import { missingPunchSummary } from "@/lib/timesheets/missing-punches";
import {
  fetchPublishedScheduleSlots,
  type PublishedScheduleSlot,
} from "@/lib/timesheets/scheduled-absent";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

export type TimesheetExportRow = TimesheetRow & {
  scheduledTime: string;
  onTime: boolean;
  late: boolean;
  absent: boolean;
  missingClockIn: boolean;
  missingClockOut: boolean;
  unpaidLeave: boolean;
  /** Employee-level bonus for the period (apply once on subtotal, not every shift). */
  bonusAmount: number;
  department: string;
  payType: "hourly" | "salary";
  /** Hourly rate or monthly salary amount, depending on payType. */
  rateAmount: number;
  /** Earnings for this shift only (excludes bonus). */
  wages: number;
};

type EmployeeExportMeta = {
  full_name: string;
  department: string;
  schedule_start_time: string;
  schedule_end_time: string;
  bonus_amount: number;
  bonus_policy: BonusPolicy;
  bonus_cycle_start_month: number;
  pay_type: "hourly" | "salary";
  hourly_rate: number;
  salary_amount: number | null;
  working_days: number[];
  /** Per-employee override of late grace margin; null = inherit company default. */
  late_grace_minutes: number | null;
};

type ScheduleSlot = PublishedScheduleSlot;

type DepartmentJoin = { name: string } | { name: string }[] | null;

function departmentName(join: DepartmentJoin): string {
  if (!join) return "";
  if (Array.isArray(join)) return join[0]?.name ?? "";
  return join.name ?? "";
}

function pgTimeToHm(value: string) {
  return value.trim().slice(0, 5);
}

function scheduledTimeLabel(
  employeeId: string,
  date: string,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>
): string {
  const shift = schedulesByKey.get(`${employeeId}:${date}`);
  if (shift) {
    return formatShiftTimeRange(
      pgTimeToHm(shift.start_time),
      pgTimeToHm(shift.end_time)
    );
  }
  const employee = employees.get(employeeId);
  if (!employee) return "";
  return formatShiftTimeRange(
    pgTimeToHm(employee.schedule_start_time),
    pgTimeToHm(employee.schedule_end_time)
  );
}

function resolvePunctuality(
  row: TimesheetRow,
  scheduleStartHm: string,
  timezone: string,
  graceMinutes: number
): { onTime: boolean; late: boolean } {
  if (!row.clockIn) {
    return { onTime: false, late: false };
  }

  const stored = row.clockInAttendanceStatus;
  if (stored === "on_time") return { onTime: true, late: false };
  if (stored === "late") return { onTime: false, late: true };

  const computed = computeAttendanceStatus(
    row.clockIn,
    scheduleStartHm,
    timezone,
    graceMinutes
  );
  return computed === "on_time"
    ? { onTime: true, late: false }
    : { onTime: false, late: true };
}

function scheduleStartHmForRow(
  employeeId: string,
  date: string,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>
): string {
  const shift = schedulesByKey.get(`${employeeId}:${date}`);
  if (shift) return pgTimeToHm(shift.start_time);
  const employee = employees.get(employeeId);
  return employee ? pgTimeToHm(employee.schedule_start_time) : "09:00";
}

function enrichRow(
  row: TimesheetRow,
  employees: Map<string, EmployeeExportMeta>,
  schedulesByKey: Map<string, ScheduleSlot>,
  unpaidLeave: {
    employee_id: string;
    start_date: string;
    end_date: string;
  }[],
  approvedLeave: {
    employee_id: string;
    start_date: string;
    end_date: string;
  }[],
  timezone: string,
  companyLateGraceMinutes: number,
  options: { forceAbsent?: boolean }
): TimesheetExportRow {
  const meta = employees.get(row.employeeId);
  const scheduledTime = scheduledTimeLabel(
    row.employeeId,
    row.date,
    employees,
    schedulesByKey
  );
  const scheduleStartHm = scheduleStartHmForRow(
    row.employeeId,
    row.date,
    employees,
    schedulesByKey
  );
  const graceMinutes = resolveGraceMinutes({
    employeeOverride: meta?.late_grace_minutes,
    companyDefault: companyLateGraceMinutes,
  });
  const { onTime, late } = resolvePunctuality(
    row,
    scheduleStartHm,
    timezone,
    graceMinutes
  );
  const unpaidLeaveDay = isDateOnApprovedTimeOff(
    row.date,
    row.employeeId,
    unpaidLeave
  );
  const onApprovedLeave = isDateOnApprovedTimeOff(
    row.date,
    row.employeeId,
    approvedLeave
  );
  const onWorkingDay = meta
    ? isWorkingDayOnDate(meta.working_days, row.date)
    : false;
  const hasPublishedShift = Boolean(
    schedulesByKey.get(`${row.employeeId}:${row.date}`)
  );
  const absent =
    options.forceAbsent ||
    (!row.clockIn &&
      !onApprovedLeave &&
      (hasPublishedShift || onWorkingDay));

  const payType = meta?.pay_type ?? "hourly";
  const hourlyRate = meta?.hourly_rate ?? 0;
  const salaryAmount = meta?.salary_amount ?? null;
  const workingDays = meta?.working_days ?? [1, 2, 3, 4, 5];
  const rateAmount =
    payType === "salary" ? Number(salaryAmount ?? 0) : hourlyRate;

  const wages = timesheetShiftWages({
    payType,
    hourlyRate,
    salaryAmount,
    workingDays,
    shiftDate: row.date,
    totalHours: row.totalHours,
    unpaidLeave: unpaidLeaveDay,
    absent,
  });

  const { missingClockIn, missingClockOut } = missingPunchSummary(row);

  return {
    ...row,
    employeeName: (meta?.full_name ?? row.employeeName).trim(),
    scheduledTime,
    onTime: row.clockIn ? onTime : false,
    late: row.clockIn ? late : false,
    absent,
    missingClockIn,
    missingClockOut,
    unpaidLeave: unpaidLeaveDay,
    /** Placeholder — replaced by applyPolicyAwareBonus after all rows are built. */
    bonusAmount: 0,
    department: meta?.department ?? "",
    payType,
    rateAmount,
    wages,
  };
}

/** Set each employee's row.bonusAmount to policy-aware due for dates in the set. */
function applyPolicyAwareBonus(
  rows: TimesheetExportRow[],
  employees: Map<string, EmployeeExportMeta>
): TimesheetExportRow[] {
  const datesByEmployee = new Map<string, string[]>();
  for (const row of rows) {
    const list = datesByEmployee.get(row.employeeId) ?? [];
    list.push(row.date);
    datesByEmployee.set(row.employeeId, list);
  }

  const bonusByEmployee = new Map<string, number>();
  for (const [employeeId, dates] of datesByEmployee) {
    const meta = employees.get(employeeId);
    if (!meta || meta.bonus_amount <= 0) {
      bonusByEmployee.set(employeeId, 0);
      continue;
    }
    bonusByEmployee.set(
      employeeId,
      bonusDueForDateSet(
        dates,
        meta.bonus_amount,
        meta.bonus_policy,
        meta.bonus_cycle_start_month
      )
    );
  }

  return rows.map((row) => ({
    ...row,
    bonusAmount: bonusByEmployee.get(row.employeeId) ?? 0,
  }));
}

async function fetchEmployeeExportMeta(
  companyId: string,
  employeeIds: string[]
): Promise<Map<string, EmployeeExportMeta>> {
  if (employeeIds.length === 0) return new Map();

  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, departments ( name ), schedule_start_time, schedule_end_time, bonus_amount, bonus_policy, bonus_cycle_start_month, pay_type, hourly_rate, salary_amount, working_days, late_grace_minutes"
    )
    .eq("company_id", companyId)
    .in("id", employeeIds);

  if (error) {
    console.error("fetchEmployeeExportMeta failed:", error.message);
    return new Map();
  }

  const map = new Map<string, EmployeeExportMeta>();
  for (const row of data ?? []) {
    const payType =
      (row.pay_type as string) === "salary" ? "salary" : "hourly";
    map.set(row.id as string, {
      full_name: String(row.full_name ?? "Unknown").trim(),
      department: departmentName(row.departments as DepartmentJoin),
      schedule_start_time: (row.schedule_start_time as string) ?? "09:00:00",
      schedule_end_time: (row.schedule_end_time as string) ?? "17:00:00",
      bonus_amount: Number(row.bonus_amount ?? 0),
      bonus_policy: normalizeBonusPolicy(row.bonus_policy),
      bonus_cycle_start_month: normalizeCycleStartMonth(
        row.bonus_cycle_start_month
      ),
      pay_type: payType,
      hourly_rate: Number(row.hourly_rate ?? 0),
      salary_amount:
        row.salary_amount != null ? Number(row.salary_amount) : null,
      working_days: normalizeWorkingDays(
        (row.working_days as number[] | null) ?? [1, 2, 3, 4, 5]
      ),
      late_grace_minutes:
        row.late_grace_minutes == null
          ? null
          : Number(row.late_grace_minutes),
    });
  }
  return map;
}

/**
 * Company-level late-grace margin, falls back to 15 if the column is missing
 * (e.g. local dev without the latest migration applied).
 */
async function fetchCompanyLateGraceMinutes(companyId: string): Promise<number> {
  const admin = createClient();
  const { data } = await admin
    .from("companies")
    .select("late_grace_minutes")
    .eq("id", companyId)
    .maybeSingle();
  const raw = data?.late_grace_minutes;
  if (raw == null || !Number.isFinite(Number(raw))) return 15;
  return Number(raw);
}

export async function getTimesheetExportRows(
  companyId: string,
  timezone: string,
  from: string,
  to: string,
  employeeId?: string
): Promise<TimesheetExportRow[]> {
  const baseRows = await getAllTimesheetRows(
    companyId,
    timezone,
    from,
    to,
    employeeId
  );

  const employeeIds = [
    ...new Set(baseRows.map((row) => row.employeeId)),
  ] as string[];

  const schedulesByKey = await fetchPublishedScheduleSlots(
    companyId,
    from,
    to,
    employeeId
  );

  for (const slot of schedulesByKey.values()) {
    if (!employeeIds.includes(slot.employee_id)) {
      employeeIds.push(slot.employee_id);
    }
  }

  const [employees, unpaidLeave, approvedLeave, companyLateGraceMinutes] =
    await Promise.all([
      fetchEmployeeExportMeta(companyId, employeeIds),
      listApprovedUnpaidLeaveForRange(companyId, from, to),
      listApprovedTimeOffForRange(companyId, from, to),
      fetchCompanyLateGraceMinutes(companyId),
    ]);

  const enriched = baseRows.map((row) =>
    enrichRow(
      row,
      employees,
      schedulesByKey,
      unpaidLeave,
      approvedLeave,
      timezone,
      companyLateGraceMinutes,
      { forceAbsent: row.id.startsWith("absent:") }
    )
  );

  return applyPolicyAwareBonus(enriched, employees);
}
