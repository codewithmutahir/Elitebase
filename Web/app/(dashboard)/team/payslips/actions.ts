"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";
import { resolveCurrency } from "@/lib/currencies";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAYSLIP_BYTES = 5 * 1024 * 1024;

function revalidatePayslips() {
  revalidatePath("/team/payslips");
  revalidatePath("/portal/payslips");
  revalidatePath("/portal/pay");
}

export async function createPayslip(formData: FormData) {
  const { company } = await requireCompanySession();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const periodLabel = String(formData.get("periodLabel") ?? "").trim() || null;
  const grossRaw = String(formData.get("grossAmount") ?? "").trim();
  const netRaw = String(formData.get("netAmount") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const file = formData.get("file");

  if (!employeeId) return { error: "Employee is required." };
  if (!DATE_PATTERN.test(periodStart) || !DATE_PATTERN.test(periodEnd)) {
    return { error: "Enter a valid pay period." };
  }
  if (periodEnd < periodStart) {
    return { error: "Period end must be on or after start." };
  }

  const grossAmount = grossRaw ? Number(grossRaw) : null;
  const netAmount = netRaw ? Number(netRaw) : null;
  if (grossAmount != null && (!Number.isFinite(grossAmount) || grossAmount < 0)) {
    return { error: "Gross amount is invalid." };
  }
  if (netAmount != null && (!Number.isFinite(netAmount) || netAmount < 0)) {
    return { error: "Net amount is invalid." };
  }

  const admin = createClient();
  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!employee) return { error: "Employee not found." };

  let filePath: string | null = null;
  let fileUrl: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PAYSLIP_BYTES) {
      return { error: "Payslip file must be 5 MB or smaller." };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const allowed = ["pdf", "png", "jpg", "jpeg", "webp"];
    if (!allowed.includes(ext)) {
      return { error: "Upload a PDF or image file." };
    }

    filePath = `${company.id}/${employeeId}/payslips/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from("employee-documents")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("createPayslip upload:", uploadError.message);
      return { error: "Could not upload payslip file." };
    }

    // Private bucket: persist path only; signed URLs are issued at read time.
    fileUrl = null;
  }

  const { error } = await admin.from("payslips").insert({
    company_id: company.id,
    employee_id: employeeId,
    period_start: periodStart,
    period_end: periodEnd,
    period_label: periodLabel,
    gross_amount: grossAmount,
    net_amount: netAmount,
    currency: resolveCurrency(company.currency),
    file_path: filePath,
    file_url: fileUrl,
    notes,
  });

  if (error) {
    console.error("createPayslip insert:", error.message);
    return { error: "Could not publish payslip." };
  }

  revalidatePayslips();
  return { ok: true as const };
}

export async function deletePayslip(payslipId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: existing } = await admin
    .from("payslips")
    .select("id, file_path")
    .eq("id", payslipId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };

  if (existing.file_path) {
    await admin.storage.from("employee-documents").remove([existing.file_path]);
  }

  const { error } = await admin
    .from("payslips")
    .delete()
    .eq("id", payslipId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deletePayslip:", error.message);
    return { error: "Could not delete payslip." };
  }

  revalidatePayslips();
  return { ok: true as const };
}
