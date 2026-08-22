import { createClient } from "@/lib/supabase/server";

export const ALL_ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

export const WORKING_DAY_PRESETS = {
  "4-day": [1, 2, 3, 4],
  "5-day": [1, 2, 3, 4, 5],
  "6-day": [1, 2, 3, 4, 5, 6],
} as const;

export type WorkingDayPreset = keyof typeof WORKING_DAY_PRESETS;

export const ISO_DAY_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

export function isoToPgDay(isoDay: number): number {
  return isoDay === 7 ? 0 : isoDay;
}

export function pgDayToIso(pgDay: number): number {
  return pgDay === 0 ? 7 : pgDay;
}

export function pgDayFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function normalizeWorkingDays(days: number[]): number[] {
  const unique = [...new Set(days.filter((day) => day >= 1 && day <= 7))].sort(
    (a, b) => a - b
  );
  return unique.length > 0 ? unique : [...DEFAULT_WORKING_DAYS];
}

export function isWorkingDayOnPgDay(workingDays: number[], pgDay: number): boolean {
  return normalizeWorkingDays(workingDays).includes(pgDayToIso(pgDay));
}

export function isWorkingDayOnDate(workingDays: number[], dateKey: string): boolean {
  return isWorkingDayOnPgDay(workingDays, pgDayFromDateKey(dateKey));
}

export function formatWorkingDaysLabel(workingDays: number[]): string {
  return normalizeWorkingDays(workingDays)
    .map((day) => ISO_DAY_LABELS[day])
    .join(", ");
}

export function detectWorkingDayPreset(
  workingDays: number[]
): WorkingDayPreset | "custom" {
  const normalized = normalizeWorkingDays(workingDays);
  const key = `${normalized.length}-day` as WorkingDayPreset;
  const preset = WORKING_DAY_PRESETS[key];
  if (
    preset &&
    preset.length === normalized.length &&
    preset.every((day, index) => day === normalized[index])
  ) {
    return key;
  }
  return "custom";
}

export async function syncWorkingDaysToAvailability(
  companyId: string,
  employeeId: string,
  workingDays: number[]
) {
  const admin = createClient();
  const normalized = normalizeWorkingDays(workingDays);
  const offPgDays = ALL_ISO_DAYS.filter((isoDay) => !normalized.includes(isoDay)).map(
    isoToPgDay
  );
  const onPgDays = normalized.map(isoToPgDay);

  for (const pgDay of onPgDays) {
    const { error } = await admin
      .from("employee_availability")
      .delete()
      .eq("employee_id", employeeId)
      .eq("company_id", companyId)
      .eq("day_of_week", pgDay);

    if (error) {
      console.error("syncWorkingDaysToAvailability clear:", error.message);
      throw new Error("Could not sync working days.");
    }
  }

  for (const pgDay of offPgDays) {
    const { error } = await admin.from("employee_availability").upsert(
      {
        employee_id: employeeId,
        company_id: companyId,
        day_of_week: pgDay,
        is_available: false,
        start_time: null,
        end_time: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,day_of_week" }
    );

    if (error) {
      console.error("syncWorkingDaysToAvailability upsert:", error.message);
      throw new Error("Could not sync working days.");
    }
  }
}

export async function assertEmployeeWorkingDay(
  companyId: string,
  employeeId: string,
  shiftDate: string
): Promise<{ error?: string }> {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select("working_days")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) {
    return { error: "Employee not found." };
  }

  const workingDays = normalizeWorkingDays(
    (data.working_days as number[] | null) ?? DEFAULT_WORKING_DAYS
  );

  if (!isWorkingDayOnDate(workingDays, shiftDate)) {
    return { error: "This employee is not scheduled to work on that day." };
  }

  return {};
}
