"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";
import { companyTimezone } from "@/lib/dashboard/format";
import { zonedLocalToUtcIso, addDaysToDateKey } from "@/lib/timesheets/dates";

export type UpdateTimesheetShiftInput = {
  employeeId: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  clockInEventId: string | null;
  clockOutEventId: string | null;
};

export type UpdateTimesheetShiftResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{2}:\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function updateTimesheetShift(
  input: UpdateTimesheetShiftInput
): Promise<UpdateTimesheetShiftResult> {
  const { company } = await requireCompanySession();
  const timezone = companyTimezone(company.timezone);

  const employeeId = input.employeeId?.trim();
  const date = input.date?.trim();
  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Invalid employee or date." };
  }

  const clockInTime = normalizeTime(input.clockInTime);
  const clockOutTime = normalizeTime(input.clockOutTime);

  if (!clockInTime && !clockOutTime) {
    return { ok: false, error: "Enter at least a clock-in or clock-out time." };
  }

  function clockOutDateKey(): string {
    if (!clockOutTime) return date;
    if (!clockInTime) return date;
    if (clockOutTime <= clockInTime) {
      return addDaysToDateKey(date, 1);
    }
    return date;
  }

  const outDate = clockOutDateKey();

  if (
    clockInTime &&
    clockOutTime &&
    outDate === date &&
    clockOutTime <= clockInTime
  ) {
    return { ok: false, error: "Clock out must be after clock in." };
  }

  const admin = createClient();

  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!employee) {
    return { ok: false, error: "Employee not found." };
  }

  async function upsertPunch(
    type: "clock_in" | "clock_out",
    timeHm: string | null,
    eventId: string | null,
    dateKey: string
  ): Promise<string | null> {
    if (!timeHm) {
      // Clear: delete existing punch if present
      if (eventId) {
        const { error } = await admin
          .from("attendance")
          .delete()
          .eq("id", eventId)
          .eq("company_id", company.id)
          .eq("employee_id", employeeId);
        if (error) {
          console.error(`delete ${type} failed:`, error.message);
          return `Could not clear ${type === "clock_in" ? "clock in" : "clock out"}.`;
        }
      }
      return null;
    }

    const iso = zonedLocalToUtcIso(dateKey, timeHm, timezone);
    if (!iso) {
      return `Invalid ${type === "clock_in" ? "clock in" : "clock out"} time.`;
    }

    if (eventId) {
      const { data: existing } = await admin
        .from("attendance")
        .select("id")
        .eq("id", eventId)
        .eq("company_id", company.id)
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (!existing) {
        return "Attendance record not found.";
      }

      const { error } = await admin
        .from("attendance")
        .update({ timestamp: iso })
        .eq("id", eventId)
        .eq("company_id", company.id);

      if (error) {
        console.error(`update ${type} failed:`, error.message);
        return `Could not update ${type === "clock_in" ? "clock in" : "clock out"}.`;
      }
      return null;
    }

    const { error } = await admin.from("attendance").insert({
      company_id: company.id,
      employee_id: employeeId,
      type,
      timestamp: iso,
      tablet_id: null,
      face_match_score: null,
    });

    if (error) {
      console.error(`insert ${type} failed:`, error.message);
      return `Could not add ${type === "clock_in" ? "clock in" : "clock out"}.`;
    }
    return null;
  }

  const inError = await upsertPunch(
    "clock_in",
    clockInTime,
    input.clockInEventId,
    date
  );
  if (inError) return { ok: false, error: inError };

  const outError = await upsertPunch(
    "clock_out",
    clockOutTime,
    input.clockOutEventId,
    outDate
  );
  if (outError) return { ok: false, error: outError };

  revalidatePath("/timesheets");
  return { ok: true };
}
