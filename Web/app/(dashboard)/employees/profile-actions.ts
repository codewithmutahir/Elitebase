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

function revalidateEmployee(companyId: string, employeeId: string) {
  invalidateEmployeeListsCache(companyId);
  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
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
    bonus_amount: number;
    bonus_note: string | null;
  }
) {
  const { company } = await requireCompanySession();
  const admin = createClient();
  const workingDays = normalizeWorkingDays(data.working_days);

  if (data.pay_type === "salary" && (!data.salary_amount || data.salary_amount <= 0)) {
    return { error: "Monthly salary is required for salaried employees." };
  }

  const startTime = data.schedule_start_time || "09:00";
  const endTime = data.schedule_end_time || "17:00";
  // end < start is overnight (next calendar day); only identical times are invalid.
  if (endTime === startTime) {
    return { error: "Shift end must differ from shift start." };
  }

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
      bonus_amount: data.bonus_amount ?? 0,
      bonus_note: data.bonus_note?.trim() || null,
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateEmployeeJobDetails:", error.message);
    return { error: "Could not save job details." };
  }

  try {
    await syncWorkingDaysToAvailability(company.id, employeeId, workingDays);
  } catch {
    return { error: "Could not sync working days to availability." };
  }

  revalidateEmployee(company.id, employeeId);
  revalidatePath("/schedule/schedule");
  revalidatePath("/schedule/availability");
  return { ok: true };
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

  const admin = createClient();

  const { data: doc } = await admin
    .from("employee_documents")
    .select("id, versions")
    .eq("id", documentId)
    .eq("employee_id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!doc) return { error: "Document not found." };

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${company.id}/${employeeId}/${documentId}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("employee-documents")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    console.error("uploadEmployeeDocument storage:", uploadError.message);
    return { error: "File upload failed." };
  }

  const { data: publicUrl } = admin.storage
    .from("employee-documents")
    .getPublicUrl(path);

  const { error: updateError } = await admin
    .from("employee_documents")
    .update({
      file_url: publicUrl.publicUrl,
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
