"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateEmployeePin, hashEmployeePin } from "@/lib/employees/pin";
import { requireCompanySession } from "@/lib/employees/session";

export type AddEmployeeState = {
  error?: string;
  plainPin?: string;
  employeeName?: string;
  employeeId?: string;
};

export async function addEmployee(
  _prev: AddEmployeeState | null,
  formData: FormData
): Promise<AddEmployeeState> {
  const { company } = await requireCompanySession();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "employee").trim() || "employee";
  const departmentId =
    String(formData.get("departmentId") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const hireDate = String(formData.get("hireDate") ?? "").trim() || null;

  if (!fullName) {
    return { error: "Full name is required." };
  }

  const plainPin = generateEmployeePin();
  const pinHash = await hashEmployeePin(plainPin);
  const admin = createClient();

  const { data: employee, error: insertError } = await admin
    .from("employees")
    .insert({
      company_id: company.id,
      full_name: fullName,
      email,
      role,
      department_id: departmentId,
      position,
      hire_date: hireDate,
      status: "active",
      employment_type: role === "manager" ? "manager" : "employee",
    })
    .select("id, full_name")
    .single();

  if (insertError || !employee) {
    console.error("addEmployee insert failed:", insertError?.message);
    return { error: "Could not create employee. Please try again." };
  }

  const { error: pinError } = await admin.from("employee_pins").insert({
    employee_id: employee.id,
    company_id: company.id,
    pin: pinHash,
    pin_plain: plainPin,
  });

  if (pinError) {
    console.error("addEmployee pin failed:", pinError.message);
    await admin.from("employees").delete().eq("id", employee.id);
    return { error: "Employee created but PIN setup failed. Please try again." };
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employee.id}`);

  return {
    plainPin,
    employeeName: employee.full_name,
    employeeId: employee.id,
  };
}

export type RegeneratePinResult = {
  pin?: string;
  error?: string;
};

/** Regenerates kiosk PIN and saves retrievable pin_plain for admin display. */
export async function regenerateEmployeePin(
  employeeId: string
): Promise<RegeneratePinResult> {
  const { company } = await requireCompanySession();
  const plainPin = generateEmployeePin();
  const pinHash = await hashEmployeePin(plainPin);
  const admin = createClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("status, is_active")
    .eq("id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (employeeError || !employee) {
    return { error: "Employee not found." };
  }

  if (employee.status === "terminated" || !employee.is_active) {
    return {
      error:
        "Cannot reset PIN for a terminated employee. Reactivate them first.",
    };
  }

  const { data: existing, error: lookupError } = await admin
    .from("employee_pins")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (lookupError || !existing) {
    return { error: "No PIN record found for this employee." };
  }

  const { error: updateError } = await admin
    .from("employee_pins")
    .update({ pin: pinHash, pin_plain: plainPin })
    .eq("employee_id", employeeId)
    .eq("company_id", company.id);

  if (updateError) {
    console.error("regenerateEmployeePin failed:", updateError.message);
    return { error: "Could not reset PIN. Please try again." };
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);

  return { pin: plainPin };
}

export async function updateEmployee(employeeId: string, formData: FormData) {
  const { company } = await requireCompanySession();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "employee").trim() || "employee";
  const departmentId =
    String(formData.get("departmentId") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const hireDate = String(formData.get("hireDate") ?? "").trim() || null;

  if (!fullName) {
    redirect(`/employees/${employeeId}?error=missing_name`);
  }

  const admin = createClient();
  const { error } = await admin
    .from("employees")
    .update({
      full_name: fullName,
      email,
      role,
      department_id: departmentId,
      position,
      hire_date: hireDate,
    })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateEmployee failed:", error.message);
    redirect(`/employees/${employeeId}?error=save_failed`);
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}?saved=1`);
}

/** @deprecated Use terminateEmployee from profile-actions */
export async function deactivateEmployee(employeeId: string) {
  const { terminateEmployee } = await import(
    "@/app/(dashboard)/employees/profile-actions"
  );
  const result = await terminateEmployee(employeeId);
  if (result.error) {
    redirect(`/employees/${employeeId}?error=deactivate_failed`);
  }
  redirect("/employees");
}

/** @deprecated Terminated employees use terminate flow */
export async function reactivateEmployee(employeeId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("employees")
    .update({ status: "active" })
    .eq("id", employeeId)
    .eq("company_id", company.id);

  if (error) {
    console.error("reactivateEmployee failed:", error.message);
    redirect(`/employees/${employeeId}?error=reactivate_failed`);
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}?saved=1`);
}
