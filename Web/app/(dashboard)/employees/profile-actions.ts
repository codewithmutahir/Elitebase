"use server";

import { revalidatePath } from "next/cache";
import { invalidateEmployeeListsCache } from "@/lib/cache/invalidate";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";
import type { EmploymentType, PayType } from "@/lib/employees/profile-queries";
import {
  normalizeWorkingDays,
  syncWorkingDaysToAvailability,
} from "@/lib/employees/working-days";
import {
  normalizeBonusPolicy,
  normalizeCycleStartMonth,
  type BonusPolicy,
} from "@/lib/payroll/bonus";
import {
  currentPayAmount,
  normalizeIncrementKind,
  roundMoney,
  type SalaryIncrementKind,
} from "@/lib/employees/salary-increments";

function revalidateEmployee(companyId: string, employeeId: string) {
  invalidateEmployeeListsCache(companyId);
  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
}

async function resolveAuthorName(): Promise<string> {
  try {
    const [{ auth }, { headers }] = await Promise.all([
      import("@/lib/auth"),
      import("next/headers"),
    ]);
    const fullSession = await auth.api.getSession({ headers: await headers() });
    return fullSession?.user?.name ?? "Admin";
  } catch {
    return "Admin";
  }
}

export async function updateEmployeeJobDetails(
  employeeId: string,
  data: {
    employment_type: EmploymentType;
    hourly_rate: number;
    hire_date: string | null;
    pay_type: PayType;
    salary_amount: number | null;
    working_days: number[];
    schedule_start_time: string;
    schedule_end_time: string;
    late_grace_minutes: number | null;
    bonus_amount: number;
    bonus_note: string | null;
    bonus_policy: BonusPolicy;
    bonus_cycle_start_month: number;
  }
) {
  const { company, userId } = await requireCompanySession();
  const admin = createClient();
  const workingDays = normalizeWorkingDays(data.working_days);
  const bonusPolicy = normalizeBonusPolicy(data.bonus_policy);
  const cycleStart = normalizeCycleStartMonth(data.bonus_cycle_start_month);

  if (data.pay_type === "salary" && (!data.salary_amount || data.salary_amount <= 0)) {
    return { error: "Monthly salary is required for salaried employees." };
  }

  const startTime = data.schedule_start_time || "09:00";
  const endTime = data.schedule_end_time || "17:00";
  // end < start is overnight (next calendar day); only identical times are invalid.
  if (endTime === startTime) {
    return { error: "Shift end must differ from shift start." };
  }

  if (data.bonus_amount < 0) {
    return { error: "Bonus amount cannot be negative." };
  }

  let lateGraceMinutes: number | null = data.late_grace_minutes;
  if (lateGraceMinutes != null) {
    if (!Number.isFinite(lateGraceMinutes)) {
      return { error: "Late margin must be a number between 0 and 120." };
    }
    lateGraceMinutes = Math.min(120, Math.max(0, Math.trunc(lateGraceMinutes)));
  }

  const { data: existing, error: fetchError } = await admin
    .from("employees")
    .select("id, pay_type, salary_amount, hourly_rate")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { error: "Employee not found." };
  }

  const previousAmount = currentPayAmount({
    pay_type: existing.pay_type as PayType,
    salary_amount:
      existing.salary_amount != null ? Number(existing.salary_amount) : null,
    hourly_rate: Number(existing.hourly_rate ?? 0),
  });
  const nextAmount =
    data.pay_type === "salary"
      ? roundMoney(Number(data.salary_amount ?? 0))
      : roundMoney(Number(data.hourly_rate ?? 0));
  const payChanged =
    existing.pay_type !== data.pay_type ||
    roundMoney(previousAmount) !== nextAmount;

  const { error } = await admin
    .from("employees")
    .update({
      employment_type: data.employment_type,
      hourly_rate: data.pay_type === "hourly" ? data.hourly_rate : 0,
      hire_date: data.hire_date || null,
      pay_type: data.pay_type,
      salary_amount: data.pay_type === "salary" ? data.salary_amount : null,
      salary_period: "monthly",
      working_days: workingDays,
      schedule_start_time: startTime,
      schedule_end_time: endTime,
      late_grace_minutes: lateGraceMinutes,
      bonus_amount: data.bonus_amount ?? 0,
      bonus_note: data.bonus_note?.trim() || null,
      bonus_policy: bonusPolicy,
      bonus_cycle_start_month: cycleStart,
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateEmployeeJobDetails:", error.message);
    return { error: "Could not save job details." };
  }

  let loggedIncrement: {
    id: string;
    employee_id: string;
    company_id: string;
    effective_date: string;
    pay_type: PayType;
    previous_amount: number;
    new_amount: number;
    increment_amount: number;
    kind: SalaryIncrementKind;
    reason: string | null;
    created_by: string | null;
    created_by_name: string;
    created_at: string;
  } | null = null;

  if (payChanged && nextAmount > 0) {
    const authorName = await resolveAuthorName();
    const today = new Date().toISOString().slice(0, 10);
    const { data: insertedIncrement, error: incrementError } = await admin
      .from("employee_salary_increments")
      .insert({
        company_id: company.id,
        employee_id: employeeId,
        effective_date: today,
        pay_type: data.pay_type,
        previous_amount: roundMoney(previousAmount),
        new_amount: nextAmount,
        kind: "adjustment",
        reason:
          existing.pay_type !== data.pay_type
            ? `Pay type changed to ${data.pay_type}`
            : "Updated from job details",
        created_by: userId,
        created_by_name: authorName,
      })
      .select(
        "id, employee_id, company_id, effective_date, pay_type, previous_amount, new_amount, increment_amount, kind, reason, created_by, created_by_name, created_at"
      )
      .maybeSingle();

    if (incrementError) {
      console.error(
        "updateEmployeeJobDetails increment log:",
        incrementError.message
      );
    } else if (insertedIncrement) {
      loggedIncrement = {
        id: insertedIncrement.id as string,
        employee_id: insertedIncrement.employee_id as string,
        company_id: insertedIncrement.company_id as string,
        effective_date: insertedIncrement.effective_date as string,
        pay_type:
          insertedIncrement.pay_type === "salary" ? "salary" : "hourly",
        previous_amount: Number(insertedIncrement.previous_amount),
        new_amount: Number(insertedIncrement.new_amount),
        increment_amount:
          insertedIncrement.increment_amount != null
            ? Number(insertedIncrement.increment_amount)
            : nextAmount - roundMoney(previousAmount),
        kind: normalizeIncrementKind(insertedIncrement.kind as string),
        reason: (insertedIncrement.reason as string | null) ?? null,
        created_by: (insertedIncrement.created_by as string | null) ?? null,
        created_by_name: (insertedIncrement.created_by_name as string) ?? "",
        created_at: insertedIncrement.created_at as string,
      };
    }
  }

  try {
    await syncWorkingDaysToAvailability(company.id, employeeId, workingDays);
  } catch {
    return { error: "Could not sync working days to availability." };
  }

  revalidateEmployee(company.id, employeeId);
  revalidatePath("/schedule/schedule");
  revalidatePath("/schedule/availability");
  revalidatePath("/team/payroll");
  return { ok: true as const, loggedIncrement };
}

export async function recordSalaryIncrement(
  employeeId: string,
  data: {
    effective_date: string;
    new_amount: number;
    kind?: SalaryIncrementKind;
    reason?: string | null;
  }
) {
  const { company, userId } = await requireCompanySession();
  const admin = createClient();

  const effectiveDate = data.effective_date?.trim();
  if (!effectiveDate || Number.isNaN(Date.parse(`${effectiveDate}T12:00:00`))) {
    return { error: "Effective date is required." };
  }

  const newAmount = roundMoney(Number(data.new_amount));
  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    return { error: "New pay amount must be greater than zero." };
  }

  const kind = normalizeIncrementKind(data.kind);
  const reason = data.reason?.trim() || null;

  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, pay_type, salary_amount, hourly_rate, status")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (fetchError || !employee) {
    return { error: "Employee not found." };
  }

  if (employee.status === "terminated") {
    return { error: "Cannot record an increment for a deactivated employee." };
  }

  const payType = (employee.pay_type ?? "hourly") as PayType;
  const previousAmount = roundMoney(
    currentPayAmount({
      pay_type: payType,
      salary_amount:
        employee.salary_amount != null ? Number(employee.salary_amount) : null,
      hourly_rate: Number(employee.hourly_rate ?? 0),
    })
  );

  if (previousAmount === newAmount) {
    return { error: "New amount is the same as current pay." };
  }

  const authorName = await resolveAuthorName();

  const { data: inserted, error: insertError } = await admin
    .from("employee_salary_increments")
    .insert({
      company_id: company.id,
      employee_id: employeeId,
      effective_date: effectiveDate,
      pay_type: payType,
      previous_amount: previousAmount,
      new_amount: newAmount,
      kind,
      reason,
      created_by: userId,
      created_by_name: authorName,
    })
    .select(
      "id, employee_id, company_id, effective_date, pay_type, previous_amount, new_amount, increment_amount, kind, reason, created_by, created_by_name, created_at"
    )
    .single();

  if (insertError || !inserted) {
    console.error("recordSalaryIncrement:", insertError?.message);
    return { error: "Could not save increment." };
  }

  const payUpdate =
    payType === "salary"
      ? { salary_amount: newAmount, salary_period: "monthly" as const }
      : { hourly_rate: newAmount };

  const { error: updateError } = await admin
    .from("employees")
    .update(payUpdate)
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (updateError) {
    console.error("recordSalaryIncrement update pay:", updateError.message);
    await admin
      .from("employee_salary_increments")
      .delete()
      .eq("id", inserted.id)
      .eq("company_id", company.id);
    return { error: "Could not update employee pay." };
  }

  revalidateEmployee(company.id, employeeId);
  revalidatePath("/team/payroll");
  return {
    ok: true as const,
    increment: {
      id: inserted.id as string,
      employee_id: inserted.employee_id as string,
      company_id: inserted.company_id as string,
      effective_date: inserted.effective_date as string,
      pay_type: (inserted.pay_type === "salary" ? "salary" : "hourly") as PayType,
      previous_amount: Number(inserted.previous_amount),
      new_amount: Number(inserted.new_amount),
      increment_amount:
        inserted.increment_amount != null
          ? Number(inserted.increment_amount)
          : newAmount - previousAmount,
      kind: normalizeIncrementKind(inserted.kind as string),
      reason: (inserted.reason as string | null) ?? null,
      created_by: (inserted.created_by as string | null) ?? null,
      created_by_name: (inserted.created_by_name as string) ?? "",
      created_at: inserted.created_at as string,
    },
    pay_type: payType,
    salary_amount: payType === "salary" ? newAmount : null,
    hourly_rate: payType === "hourly" ? newAmount : 0,
  };
}

/** Deletes the latest increment and restores prior pay when it matches current pay. */
export async function undoLatestSalaryIncrement(employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, pay_type, salary_amount, hourly_rate")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (fetchError || !employee) {
    return { error: "Employee not found." };
  }

  const { data: latest, error: latestError } = await admin
    .from("employee_salary_increments")
    .select(
      "id, pay_type, previous_amount, new_amount, effective_date, created_at"
    )
    .eq("employee_id", employeeId)
    .eq("company_id", company.id)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("undoLatestSalaryIncrement:", latestError.message);
    return { error: "Could not load increment history." };
  }

  if (!latest) {
    return { error: "No increments to undo." };
  }

  const payType = (employee.pay_type ?? "hourly") as PayType;
  const currentAmount = roundMoney(
    currentPayAmount({
      pay_type: payType,
      salary_amount:
        employee.salary_amount != null ? Number(employee.salary_amount) : null,
      hourly_rate: Number(employee.hourly_rate ?? 0),
    })
  );
  const recordedNew = roundMoney(Number(latest.new_amount));
  const previousAmount = roundMoney(Number(latest.previous_amount));

  if (latest.pay_type === payType && currentAmount === recordedNew) {
    const payUpdate =
      payType === "salary"
        ? {
            salary_amount: previousAmount > 0 ? previousAmount : null,
            salary_period: "monthly" as const,
          }
        : { hourly_rate: previousAmount };

    const { error: updateError } = await admin
      .from("employees")
      .update(payUpdate)
      .eq("id", employeeId)
      .eq("company_id", company.id);

    if (updateError) {
      console.error("undoLatestSalaryIncrement pay:", updateError.message);
      return { error: "Could not restore previous pay." };
    }
  }

  const { error: deleteError } = await admin
    .from("employee_salary_increments")
    .delete()
    .eq("id", latest.id)
    .eq("company_id", company.id);

  if (deleteError) {
    console.error("undoLatestSalaryIncrement delete:", deleteError.message);
    return { error: "Could not remove increment record." };
  }

  revalidateEmployee(company.id, employeeId);
  revalidatePath("/team/payroll");
  return {
    ok: true as const,
    restored_pay_type: payType,
    restored_amount:
      latest.pay_type === payType && currentAmount === recordedNew
        ? previousAmount
        : currentAmount,
  };
}

export async function updateEmployeePersonalInfo(
  employeeId: string,
  data: {
    full_name: string;
    email: string | null;
    phone: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    emergency_contact_relation: string | null;
    date_of_birth: string | null;
    employment_type: EmploymentType;
  }
) {
  const { company } = await requireCompanySession();

  if (!data.full_name.trim()) {
    return { error: "Preferred name is required." };
  }

  const admin = createClient();
  const { error } = await admin
    .from("employees")
    .update({
      full_name: data.full_name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      emergency_contact_name: data.emergency_contact_name?.trim() || null,
      emergency_contact_phone: data.emergency_contact_phone?.trim() || null,
      emergency_contact_relation: data.emergency_contact_relation?.trim() || null,
      date_of_birth: data.date_of_birth || null,
      employment_type: data.employment_type,
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateEmployeePersonalInfo:", error.message);
    return { error: "Could not save personal information." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function terminateEmployee(
  employeeId: string,
  reason?: string
) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("employees")
    .update({
      status: "terminated",
      termination_reason: reason?.trim() || null,
      terminated_at: new Date().toISOString(),
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("terminateEmployee:", error.message);
    return { error: "Could not terminate employee." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function reactivateEmployee(employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("employees")
    .update({
      status: "active",
      termination_reason: null,
      terminated_at: null,
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("reactivateEmployee:", error.message);
    return { error: "Could not reactivate employee." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function getEmployeeAttendanceCount(employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { count, error } = await admin
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("company_id", company.id)
    .is("voided_at", null);

  if (error) {
    console.error("getEmployeeAttendanceCount:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function deleteEmployeePermanently(
  employeeId: string,
  confirmName: string
) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, full_name")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (fetchError || !employee) {
    return { error: "Employee not found." };
  }

  if (confirmName.trim() !== employee.full_name.trim()) {
    return { error: "Confirmation name does not match." };
  }

  const { error } = await admin
    .from("employees")
    .delete()
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteEmployeePermanently:", error.message);
    return { error: "Could not delete employee." };
  }

  invalidateEmployeeListsCache(company.id);
  revalidatePath("/employees");
  return { ok: true };
}

export async function addEmployeeNote(employeeId: string, content: string) {
  const { company, userId } = await requireCompanySession();
  const trimmed = content.trim();
  if (!trimmed) return { error: "Note cannot be empty." };

  const admin = createClient();

  const { data: userRow } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!userRow) return { error: "Employee not found." };

  const [{ auth }, { headers }] = await Promise.all([
    import("@/lib/auth"),
    import("next/headers"),
  ]);
  const fullSession = await auth.api.getSession({ headers: await headers() });
  const authorName = fullSession?.user?.name ?? "Admin";

  const { error } = await admin.from("employee_notes").insert({
    employee_id: employeeId,
    company_id: company.id,
    author_id: userId,
    author_name: authorName,
    content: trimmed,
  });

  if (error) {
    console.error("addEmployeeNote:", error.message);
    return { error: "Could not add note." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function deleteEmployeeNote(noteId: string, employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("employee_notes")
    .delete()
    .eq("id", noteId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteEmployeeNote:", error.message);
    return { error: "Could not delete note." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function addEmployeeCertificate(
  employeeId: string,
  name: string
) {
  const { company } = await requireCompanySession();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Certificate name is required." };

  const admin = createClient();

  const { data: employee } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!employee) return { error: "Employee not found." };

  const { error } = await admin.from("employee_documents").insert({
    employee_id: employeeId,
    company_id: company.id,
    category: "certificate",
    name: trimmed,
    status: "not_sent",
  });

  if (error) {
    console.error("addEmployeeCertificate:", error.message);
    return { error: "Could not add certificate." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

export async function uploadEmployeeDocument(
  employeeId: string,
  documentId: string,
  formData: FormData
) {
  const { company } = await requireCompanySession();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const MAX_DOC_BYTES = 5 * 1024 * 1024;
  if (file.size > MAX_DOC_BYTES) {
    return { error: "Document must be 5 MB or smaller." };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const allowedExt = ["pdf", "png", "jpg", "jpeg", "webp"];
  if (!allowedExt.includes(ext)) {
    return { error: "Upload a PDF or image file (png, jpg, webp)." };
  }

  const mimeByExt: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  const resolvedType = mimeByExt[ext];
  if (
    file.type &&
    file.type !== "application/octet-stream" &&
    !Object.values(mimeByExt).includes(file.type)
  ) {
    return { error: "File type is not allowed." };
  }

  const admin = createClient();

  const { data: doc } = await admin
    .from("employee_documents")
    .select("id, versions")
    .eq("id", documentId)
    .eq("employee_id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!doc) return { error: "Document not found." };

  const path = `${company.id}/${employeeId}/${documentId}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("employee-documents")
    .upload(path, buffer, {
      contentType: resolvedType,
      upsert: true,
    });

  if (uploadError) {
    console.error("uploadEmployeeDocument storage:", uploadError.message);
    return { error: "File upload failed." };
  }

  const { error: updateError } = await admin
    .from("employee_documents")
    .update({
      file_path: path,
      file_url: null,
      status: "completed",
      versions: (doc.versions ?? 0) + 1,
    })
    .eq("id", documentId);

  if (updateError) {
    console.error("uploadEmployeeDocument update:", updateError.message);
    return { error: "Could not update document record." };
  }

  revalidateEmployee(company.id, employeeId);
  return { ok: true };
}

/** Creates an invite token and emails the employee portal activate link. */
export async function sendEmployeePortalInvite(employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { data: employee, error: lookupError } = await admin
    .from("employees")
    .select("id, email, full_name, status, user_id")
    .eq("company_id", company.id)
    .eq("id", employeeId)
    .maybeSingle();

  if (lookupError || !employee) {
    return { error: "Employee not found." };
  }

  if (employee.status === "terminated") {
    return { error: "Cannot invite a deactivated employee." };
  }

  if (employee.user_id) {
    return {
      error:
        "This employee already activated their portal. Ask them to sign in.",
    };
  }

  const email = employee.email?.trim() ?? "";
  if (!email) {
    return { error: "Add an email before sending an invite." };
  }

  const { createAndSendPortalInvite } = await import("@/lib/portal/invite");
  const result = await createAndSendPortalInvite({
    companyId: company.id,
    companyName: company.name,
    employeeId,
    employeeName: employee.full_name,
    email,
  });

  if ("error" in result) {
    return { error: result.error };
  }

  const { captureServerEvent } = await import(
    "@/lib/analytics/posthog-server"
  );
  const { AnalyticsEvent } = await import("@/lib/analytics/events");
  await captureServerEvent(company.id, AnalyticsEvent.employeeInvited, {
    companyId: company.id,
  });

  revalidateEmployee(company.id, employeeId);
  return {
    ok: true as const,
    email: result.email,
    invitedAt: result.invitedAt,
    emailed: result.emailed,
    ...(result.emailError ? { emailError: result.emailError } : {}),
  };
}
