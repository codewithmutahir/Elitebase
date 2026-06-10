"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toPgTime } from "@/lib/availability/format";
import { requireCompanySession } from "@/lib/employees/session";

const AVAILABILITY_PATH = "/schedule/availability";

export type AvailabilityUpdateMode = "all_day" | "hours" | "unavailable";

export async function upsertEmployeeAvailability(
  employeeId: string,
  dayOfWeek: number,
  mode: AvailabilityUpdateMode,
  hours?: { startTime: string; endTime: string }
) {
  const { company } = await requireCompanySession();

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    return { error: "Invalid day of week." };
  }

  const admin = createClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (employeeError || !employee) {
    return { error: "Employee not found." };
  }

  if (mode === "all_day") {
    const { error } = await admin
      .from("employee_availability")
      .delete()
      .eq("employee_id", employeeId)
      .eq("company_id", company.id)
      .eq("day_of_week", dayOfWeek);

    if (error) {
      console.error("clear availability failed:", error.message);
      return { error: "Could not update availability." };
    }

    revalidatePath(AVAILABILITY_PATH);
    return { ok: true };
  }

  const isAvailable = mode !== "unavailable";
  let startTime: string | null = null;
  let endTime: string | null = null;

  if (mode === "hours") {
    const start = toPgTime(hours?.startTime ?? "");
    const end = toPgTime(hours?.endTime ?? "");
    if (!start || !end) {
      return { error: "Start and end times are required." };
    }
    if (start >= end) {
      return { error: "End time must be after start time." };
    }
    startTime = start;
    endTime = end;
  }

  const { error } = await admin.from("employee_availability").upsert(
    {
      employee_id: employeeId,
      company_id: company.id,
      day_of_week: dayOfWeek,
      is_available: isAvailable,
      start_time: startTime,
      end_time: endTime,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,day_of_week" }
  );

  if (error) {
    console.error("upsertEmployeeAvailability failed:", error.message);
    return { error: "Could not save availability." };
  }

  revalidatePath(AVAILABILITY_PATH);
  return { ok: true };
}
