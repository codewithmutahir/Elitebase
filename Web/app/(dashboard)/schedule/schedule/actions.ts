"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toPgTime } from "@/lib/schedules/format";
import { toDateParam } from "@/lib/availability/week";
import { parseWeekParam } from "@/lib/availability/week";
import { requireCompanySession } from "@/lib/employees/session";

const SCHEDULE_PATH = "/schedule/schedule";

function revalidateSchedule() {
  revalidatePath(SCHEDULE_PATH);
}

export type CreateShiftInput = {
  employeeId: string | null;
  isOpenShift: boolean;
  shiftDate: string;
  startTime: string;
  endTime: string;
  departmentId?: string | null;
  roleId?: string | null;
  notes?: string | null;
  color: string;
  status: "draft" | "published";
};

export async function createScheduleShift(input: CreateShiftInput) {
  const { company } = await requireCompanySession();

  const startTime = toPgTime(input.startTime);
  const endTime = toPgTime(input.endTime);
  if (!startTime || !endTime) {
    return { error: "Start and end times are required." };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after start time." };
  }
  if (!input.shiftDate) {
    return { error: "Shift date is required." };
  }

  const admin = createClient();

  if (input.employeeId && !input.isOpenShift) {
    const { data: employee } = await admin
      .from("employees")
      .select("id")
      .eq("id", input.employeeId)
      .eq("company_id", company.id)
      .maybeSingle();
    if (!employee) return { error: "Employee not found." };
  }

  const { data, error } = await admin
    .from("schedules")
    .insert({
      company_id: company.id,
      employee_id: input.isOpenShift ? null : input.employeeId,
      shift_date: input.shiftDate,
      start_time: startTime,
      end_time: endTime,
      is_open_shift: input.isOpenShift,
      notes: input.notes?.trim() || null,
      status: input.status,
      color: input.color || "#2563EB",
      department_id: input.departmentId || null,
      role_id: input.roleId || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createScheduleShift failed:", error.message);
    return { error: "Could not create shift." };
  }

  revalidateSchedule();
  return { id: data.id };
}

export async function updateScheduleShift(
  shiftId: string,
  updates: {
    startTime?: string;
    endTime?: string;
    notes?: string | null;
  }
) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const payload: Record<string, string | null> = {};

  if (updates.startTime !== undefined) {
    const start = toPgTime(updates.startTime);
    if (!start) return { error: "Invalid start time." };
    payload.start_time = start;
  }
  if (updates.endTime !== undefined) {
    const end = toPgTime(updates.endTime);
    if (!end) return { error: "Invalid end time." };
    payload.end_time = end;
  }
  if (updates.notes !== undefined) {
    payload.notes = updates.notes?.trim() || null;
  }

  if (payload.start_time && payload.end_time && payload.start_time >= payload.end_time) {
    return { error: "End time must be after start time." };
  }

  const { error } = await admin
    .from("schedules")
    .update(payload)
    .eq("id", shiftId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateScheduleShift failed:", error.message);
    return { error: "Could not update shift." };
  }

  revalidateSchedule();
  return { ok: true };
}

export async function deleteScheduleShift(shiftId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("schedules")
    .delete()
    .eq("id", shiftId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteScheduleShift failed:", error.message);
    return { error: "Could not delete shift." };
  }

  revalidateSchedule();
  return { ok: true };
}

export async function publishDraftShifts(weekStart: string) {
  const { company } = await requireCompanySession();
  const monday = parseWeekParam(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const admin = createClient();
  const { error } = await admin
    .from("schedules")
    .update({ status: "published" })
    .eq("company_id", company.id)
    .eq("status", "draft")
    .gte("shift_date", toDateParam(monday))
    .lte("shift_date", toDateParam(sunday));

  if (error) {
    console.error("publishDraftShifts failed:", error.message);
    return { error: "Could not publish shifts." };
  }

  revalidateSchedule();
  return { ok: true };
}
