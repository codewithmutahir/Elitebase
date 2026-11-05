import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAttendanceStatus } from "@/lib/attendance/status";
import { resolveGraceMinutes } from "@/lib/attendance/grace";
import {
  companyTimezone,
  dateKeyInTimezone,
} from "@/lib/dashboard/format";
import {
  isMissingClockIn,
  isMissingClockOut,
} from "@/lib/timesheets/missing-punches";
import {
  addDaysToDateKey,
  isoToLocalTimeHm,
  queryWindowIso,
  zonedLocalToUtcIso,
} from "@/lib/timesheets/dates";
import {
  buildTimesheetRows,
  type AttendanceEvent,
} from "@/lib/timesheets/pairing";
import { fetchPublishedScheduleSlots } from "@/lib/timesheets/scheduled-absent";

export type BackfillPunchPlan = {
  companyId: string;
  employeeId: string;
  employeeName: string;
  shiftDate: string;
  type: "clock_in" | "clock_out";
  localDate: string;
  localTimeHm: string;
  timestampIso: string;
  attendanceStatus: "on_time" | "late" | null;
  reason: string;
};

type EmployeeScheduleMeta = {
  full_name: string;
  schedule_start_time: string;
  schedule_end_time: string;
  late_grace_minutes: number | null;
};

function pgTimeToHm(value: string) {
  return value.trim().slice(0, 5);
}

function resolveShiftTimes(
  employeeId: string,
  shiftDate: string,
  employees: Map<string, EmployeeScheduleMeta>,
  schedules: Map<
    string,
    { start_time: string; end_time: string }
  >
): { startHm: string; endHm: string } {
  const published = schedules.get(`${employeeId}:${shiftDate}`);
  if (published) {
    return {
      startHm: pgTimeToHm(published.start_time),
      endHm: pgTimeToHm(published.end_time),
    };
  }
  const employee = employees.get(employeeId);
  return {
    startHm: pgTimeToHm(employee?.schedule_start_time ?? "09:00:00"),
    endHm: pgTimeToHm(employee?.schedule_end_time ?? "17:00:00"),
  };
}

function clockOutLocalDate(
  shiftDate: string,
  startHm: string,
  endHm: string
): string {
  if (endHm <= startHm) {
    return addDaysToDateKey(shiftDate, 1);
  }
  return shiftDate;
}

function scheduledDurationMinutes(startHm: string, endHm: string): number {
  const [sh, sm] = startHm.split(":").map(Number);
  const [eh, em] = endHm.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return end - start;
}

function shiftEndUtcIso(
  shiftDate: string,
  startHm: string,
  endHm: string,
  timezone: string
): string | null {
  const outDate = clockOutLocalDate(shiftDate, startHm, endHm);
  return zonedLocalToUtcIso(outDate, endHm, timezone);
}

function clockOutFromClockInAndSchedule(
  clockInIso: string,
  startHm: string,
  endHm: string
): string {
  const durationMs = scheduledDurationMinutes(startHm, endHm) * 60 * 1000;
  return new Date(new Date(clockInIso).getTime() + durationMs).toISOString();
}

function shiftHasEnded(
  shiftDate: string,
  startHm: string,
  endHm: string,
  timezone: string,
  now = new Date()
): boolean {
  const endIso = shiftEndUtcIso(shiftDate, startHm, endHm, timezone);
  if (!endIso) return false;
  return now.getTime() >= new Date(endIso).getTime();
}

async function fetchEmployeeScheduleMeta(
  admin: SupabaseClient,
  companyId: string,
  employeeIds: string[]
): Promise<Map<string, EmployeeScheduleMeta>> {
  if (employeeIds.length === 0) return new Map();

  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, schedule_start_time, schedule_end_time, late_grace_minutes"
    )
    .eq("company_id", companyId)
    .in("id", employeeIds);

  if (error) {
    console.error("backfill: employee meta failed", error.message);
    return new Map();
  }

  const map = new Map<string, EmployeeScheduleMeta>();
  for (const row of data ?? []) {
    map.set(row.id as string, {
      full_name: (row.full_name as string) ?? "Unknown",
      schedule_start_time: (row.schedule_start_time as string) ?? "09:00:00",
      schedule_end_time: (row.schedule_end_time as string) ?? "17:00:00",
      late_grace_minutes:
        row.late_grace_minutes == null
          ? null
          : Number(row.late_grace_minutes),
    });
  }
  return map;
}

async function fetchAttendanceEvents(
  admin: SupabaseClient,
  companyId: string,
  from: string,
  to: string
): Promise<AttendanceEvent[]> {
  const { startIso, endIso } = queryWindowIso(from, to);
  const { data, error } = await admin
    .from("attendance")
    .select(
      "id, employee_id, type, timestamp, attendance_status, employees ( full_name )"
    )
    .eq("company_id", companyId)
    .is("voided_at", null)
    .gte("timestamp", startIso)
    .lte("timestamp", endIso)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("backfill: attendance fetch failed", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const employees = row.employees as
      | { full_name: string }
      | { full_name: string }[]
      | null;
    const name = Array.isArray(employees)
      ? employees[0]?.full_name
      : employees?.full_name;

    return {
      id: row.id as string,
      employee_id: row.employee_id as string,
      employee_name: name ?? "Unknown",
      type: row.type as string,
      timestamp: row.timestamp as string,
      attendance_status:
        row.type === "clock_in"
          ? (row.attendance_status as string | null)
          : null,
    };
  });
}

export type PlanMissingPunchesOptions = {
  companyId: string;
  from: string;
  to: string;
  /** Skip open shifts until scheduled end has passed (company local time). Default true. */
  skipOpenUntilShiftEnd?: boolean;
};

export async function planMissingPunchBackfill(
  admin: SupabaseClient,
  options: PlanMissingPunchesOptions
): Promise<BackfillPunchPlan[]> {
  const { companyId, from, to } = options;
  const skipOpenUntilShiftEnd = options.skipOpenUntilShiftEnd ?? true;

  const { data: companyRow, error: companyError } = await admin
    .from("companies")
    .select("timezone, late_grace_minutes")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError || !companyRow) {
    console.error("backfill: company lookup failed", companyError?.message);
    return [];
  }

  const timezone = companyTimezone(companyRow.timezone as string | null);
  const companyLateGraceMinutes =
    companyRow.late_grace_minutes == null
      ? 15
      : Number(companyRow.late_grace_minutes);
  const events = await fetchAttendanceEvents(admin, companyId, from, to);
  const rows = buildTimesheetRows(events, timezone, from, to);

  const employeeIds = [...new Set(rows.map((row) => row.employeeId))];
  const [employees, schedules] = await Promise.all([
    fetchEmployeeScheduleMeta(admin, companyId, employeeIds),
    fetchPublishedScheduleSlots(companyId, from, to),
  ]);

  const plans: BackfillPunchPlan[] = [];
  const now = new Date();

  const missingInOnDay = new Map<string, number>();
  const missingOutOnDay = new Map<string, number>();
  for (const row of rows) {
    const dayKey = `${row.employeeId}:${row.date}`;
    if (isMissingClockIn(row)) {
      missingInOnDay.set(dayKey, (missingInOnDay.get(dayKey) ?? 0) + 1);
    }
    if (isMissingClockOut(row)) {
      missingOutOnDay.set(dayKey, (missingOutOnDay.get(dayKey) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    if (!isMissingClockIn(row) && !isMissingClockOut(row)) continue;

    const dayKey = `${row.employeeId}:${row.date}`;
    if (isMissingClockIn(row) && (missingInOnDay.get(dayKey) ?? 0) > 1) {
      continue;
    }
    if (isMissingClockOut(row) && (missingOutOnDay.get(dayKey) ?? 0) > 1) {
      continue;
    }

    const { startHm, endHm } = resolveShiftTimes(
      row.employeeId,
      row.date,
      employees,
      schedules
    );

    if (isMissingClockIn(row)) {
      const timestampIso = zonedLocalToUtcIso(row.date, startHm, timezone);
      if (!timestampIso) continue;

      if (row.clockOut) {
        const outMs = new Date(row.clockOut).getTime();
        const inMs = new Date(timestampIso).getTime();
        if (inMs >= outMs) continue;
      }

      const graceMinutes = resolveGraceMinutes({
        employeeOverride: employees.get(row.employeeId)?.late_grace_minutes,
        companyDefault: companyLateGraceMinutes,
      });
      plans.push({
        companyId,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        shiftDate: row.date,
        type: "clock_in",
        localDate: row.date,
        localTimeHm: startHm,
        timestampIso,
        attendanceStatus: computeAttendanceStatus(
          timestampIso,
          startHm,
          timezone,
          graceMinutes
        ),
        reason: "Inferred scheduled shift start (missing clock-in)",
      });
    }

    if (isMissingClockOut(row)) {
      if (
        skipOpenUntilShiftEnd &&
        row.status === "open" &&
        !shiftHasEnded(row.date, startHm, endHm, timezone, now)
      ) {
        continue;
      }

      let timestampIso: string | null = null;
      let localDate = row.date;
      let localTimeHm = endHm;

      if (row.clockIn) {
        timestampIso = clockOutFromClockInAndSchedule(
          row.clockIn,
          startHm,
          endHm
        );
        localDate = dateKeyInTimezone(new Date(timestampIso), timezone);
        localTimeHm = isoToLocalTimeHm(timestampIso, timezone);
      } else {
        const outDate = clockOutLocalDate(row.date, startHm, endHm);
        timestampIso = zonedLocalToUtcIso(outDate, endHm, timezone);
        localDate = outDate;
      }

      if (!timestampIso) continue;

      if (row.clockIn) {
        const inMs = new Date(row.clockIn).getTime();
        const outMs = new Date(timestampIso).getTime();
        if (outMs <= inMs) continue;
      }

      plans.push({
        companyId,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        shiftDate: row.date,
        type: "clock_out",
        localDate,
        localTimeHm,
        timestampIso,
        attendanceStatus: null,
        reason: row.clockIn
          ? "Inferred clock-out from clock-in + scheduled hours"
          : "Inferred scheduled shift end (missing clock-out)",
      });
    }
  }

  const seen = new Set<string>();
  const deduped: BackfillPunchPlan[] = [];

  for (const plan of plans) {
    let timestampIso = plan.timestampIso;
    let localDate = plan.localDate;
    let localTimeHm = plan.localTimeHm;
    let key = `${plan.companyId}:${plan.employeeId}:${plan.type}:${timestampIso}`;
    let bump = 0;

    while (seen.has(key) && bump < 120) {
      bump += 1;
      timestampIso = new Date(
        new Date(plan.timestampIso).getTime() + bump * 60_000
      ).toISOString();
      localDate = dateKeyInTimezone(new Date(timestampIso), timezone);
      localTimeHm = isoToLocalTimeHm(timestampIso, timezone);
      key = `${plan.companyId}:${plan.employeeId}:${plan.type}:${timestampIso}`;
    }

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...plan,
      timestampIso,
      localDate,
      localTimeHm,
    });
  }

  return deduped;
}

export type ApplyBackfillResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

export async function applyMissingPunchBackfill(
  admin: SupabaseClient,
  plans: BackfillPunchPlan[],
  dryRun: boolean
): Promise<ApplyBackfillResult> {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const plan of plans) {
    if (dryRun) {
      inserted += 1;
      continue;
    }

    const { data: existing, error: existingError } = await admin
      .from("attendance")
      .select("id")
      .eq("company_id", plan.companyId)
      .eq("employee_id", plan.employeeId)
      .eq("type", plan.type)
      .eq("timestamp", plan.timestampIso)
      .maybeSingle();

    if (existingError) {
      errors.push(
        `${plan.employeeName} ${plan.shiftDate} ${plan.type}: lookup failed`
      );
      skipped += 1;
      continue;
    }

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error } = await admin.from("attendance").insert({
      company_id: plan.companyId,
      employee_id: plan.employeeId,
      type: plan.type,
      timestamp: plan.timestampIso,
      tablet_id: null,
      face_match_score: null,
      attendance_status: plan.attendanceStatus,
    });

    if (error) {
      errors.push(
        `${plan.employeeName} ${plan.shiftDate} ${plan.type}: ${error.message}`
      );
      skipped += 1;
      continue;
    }

    inserted += 1;
  }

  return { inserted, skipped, errors };
}

/** Re-plans until no new punches or `maxPasses` reached (pairs often need in + out). */
export async function planAndApplyMissingPunchBackfill(
  admin: SupabaseClient,
  options: PlanMissingPunchesOptions & { dryRun: boolean; maxPasses?: number }
): Promise<{
  totalInserted: number;
  totalSkipped: number;
  passes: number;
  errors: string[];
}> {
  const maxPasses = options.maxPasses ?? 6;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  let passes = 0;

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const plans = await planMissingPunchBackfill(admin, options);
    if (plans.length === 0) break;

    passes = pass;
    const result = await applyMissingPunchBackfill(
      admin,
      plans,
      options.dryRun
    );
    totalInserted += result.inserted;
    totalSkipped += result.skipped;
    errors.push(...result.errors);

    if (options.dryRun) break;
    if (result.inserted === 0) break;
  }

  return { totalInserted, totalSkipped, passes, errors };
}

export async function listCompanyIds(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin.from("companies").select("id");
  if (error) {
    console.error("backfill: list companies failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.id as string);
}

export function defaultBackfillRange(timezone: string): { from: string; to: string } {
  const to = dateKeyInTimezone(new Date(), timezone);
  const from = addDaysToDateKey(to, -365);
  return { from, to };
}
