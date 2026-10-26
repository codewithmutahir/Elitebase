"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadCompanyLogo } from "@/lib/company/logo";
import { requireCompanySession } from "@/lib/employees/session";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, isValidCurrency, resolveCurrency } from "@/lib/currencies";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";

export async function updateCompanySettings(formData: FormData) {
  const { company } = await requireCompanySession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/settings?error=missing_name");
  }

  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  const timezone = US_TIMEZONES.some((tz) => tz.value === timezoneRaw)
    ? timezoneRaw
    : company.timezone ?? DEFAULT_TIMEZONE;

  const currencyRaw = String(formData.get("currency") ?? "").trim().toUpperCase();
  const currency = isValidCurrency(currencyRaw)
    ? currencyRaw
    : resolveCurrency(company.currency);

  const sickRaw = Number(formData.get("leave_sick_total_default"));
  const paidRaw = Number(formData.get("leave_paid_total_default"));
  const leaveSickTotal = Number.isFinite(sickRaw)
    ? Math.min(366, Math.max(0, Math.trunc(sickRaw)))
    : company.leave_sick_total_default;
  const leavePaidTotal = Number.isFinite(paidRaw)
    ? Math.min(366, Math.max(0, Math.trunc(paidRaw)))
    : company.leave_paid_total_default;
  const yearTypeRaw = String(formData.get("leave_year_type") ?? "").trim();
  const leaveYearType =
    yearTypeRaw === "anniversary" ? "anniversary" : "calendar";
  const leaveProrate = formData.get("leave_prorate_mid_year") === "on";

  const admin = createClient();
  const updates: {
    name: string;
    timezone: string;
    currency: string;
    logo_url?: string;
    leave_sick_total_default: number;
    leave_paid_total_default: number;
    leave_year_type: "calendar" | "anniversary";
    leave_prorate_mid_year: boolean;
  } = {
    name,
    timezone,
    currency,
    leave_sick_total_default: leaveSickTotal,
    leave_paid_total_default: leavePaidTotal,
    leave_year_type: leaveYearType,
    leave_prorate_mid_year: leaveProrate,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const upload = await uploadCompanyLogo(admin, company.id, logo);
    if (!upload.ok) {
      redirect(`/settings?error=${upload.error}`);
    }
    updates.logo_url = upload.publicUrl;
  }

  const { error } = await admin
    .from("companies")
    .update(updates)
    .eq("id", company.id);

  if (error) {
    console.error("updateCompanySettings failed:", error.message);
    redirect("/settings?error=save_failed");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/schedule/schedule");
  revalidatePath("/employees");
  redirect("/settings?saved=1");
}
