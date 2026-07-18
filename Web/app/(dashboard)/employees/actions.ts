"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  parseEmployeeTimecardCsv,
  type ParsedEmployeeImportRow,
} from "@/lib/employees/import-csv";
import { generateEmployeePin, hashEmployeePin } from "@/lib/employees/pin";
import { requireCompanySession } from "@/lib/employees/session";

const MAX_EMPLOYEE_CSV_BYTES = 5 * 1024 * 1024;

type NewEmployeeInput = {
  fullName: string;
  email?: string | null;
  role?: string;
  departmentId?: string | null;
  position?: string | null;
  hireDate?: string | null;
  hourlyRate?: number | null;
};

function normalizeEmployeeName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

async function createEmployeeWithPin(
  companyId: string,
  input: NewEmployeeInput
): Promise<
  | { id: string; fullName: string; plainPin: string; position: string | null }
  | { error: string }
> {
  const role = input.role?.trim() || "employee";
  const plainPin = generateEmployeePin();
  const pinHash = await hashEmployeePin(plainPin);
  const admin = createClient();

  const { data: employee, error: insertError } = await admin
    .from("employees")
    .insert({
      company_id: companyId,
      full_name: input.fullName,
      email: input.email ?? null,
      role,
      department_id: input.departmentId ?? null,
      position: input.position ?? null,
      hire_date: input.hireDate ?? null,
      hourly_rate: input.hourlyRate ?? 0,
      status: "active",
      employment_type: role === "manager" ? "manager" : "employee",
    })
    .select("id, full_name, position")
    .single();

  if (insertError || !employee) {
    console.error("createEmployeeWithPin insert failed:", insertError?.message);
    return { error: "Could not create employee." };
  }

  const { error: pinError } = await admin.from("employee_pins").insert({
    employee_id: employee.id,
    company_id: companyId,
    pin: pinHash,
    pin_plain: plainPin,
  });

  if (pinError) {
    console.error("createEmployeeWithPin pin failed:", pinError.message);
    await admin.from("employees").delete().eq("id", employee.id);
    return { error: "PIN setup failed." };
  }

  return {
    id: employee.id,
    fullName: employee.full_name,
    plainPin,
    position: employee.position,
  };
}

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

  const created = await createEmployeeWithPin(company.id, {
    fullName,
    email,
    role,
    departmentId,
    position,
    hireDate,
  });

  if ("error" in created) {
    return { error: "Could not create employee. Please try again." };
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${created.id}`);

  return {
    plainPin: created.plainPin,
    employeeName: created.fullName,
    employeeId: created.id,
  };
}

export type EmployeeImportPreviewItem = ParsedEmployeeImportRow & {
  alreadyExists: boolean;
};

export type EmployeeImportPreviewResult = {
  employees: EmployeeImportPreviewItem[];
  totalDataRows: number;
  skippedRows: number;
  toImportCount: number;
  existingCount: number;
  error?: string;
};

export type EmployeeImportCreatedRow = {
  id: string;
  fullName: string;
  pin: string;
  position: string | null;
};

export type EmployeeImportResult = {
  created: EmployeeImportCreatedRow[];
  skippedExisting: string[];
  failed: Array<{ fullName: string; error: string }>;
  error?: string;
};

function assertCsvSize(csvText: string) {
  if (Buffer.byteLength(csvText, "utf8") > MAX_EMPLOYEE_CSV_BYTES) {
    return "CSV file is too large (max 5 MB).";
  }
  return null;
}

async function loadExistingEmployeeNameKeys(companyId: string) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select("full_name")
    .eq("company_id", companyId);

  if (error) {
    console.error("loadExistingEmployeeNameKeys failed:", error.message);
    return new Set<string>();
  }

  return new Set(
    (data ?? []).map((row) => normalizeEmployeeName(row.full_name ?? ""))
  );
}

export async function previewEmployeeCsvImport(
  csvText: string
): Promise<EmployeeImportPreviewResult> {
  const { company } = await requireCompanySession();

  const sizeError = assertCsvSize(csvText);
  if (sizeError) {
    return {
      employees: [],
      totalDataRows: 0,
      skippedRows: 0,
      toImportCount: 0,
      existingCount: 0,
      error: sizeError,
    };
  }

  const parsed = parseEmployeeTimecardCsv(csvText);
  if (parsed.error) {
    return {
      employees: [],
      totalDataRows: parsed.totalDataRows,
      skippedRows: parsed.skippedRows,
      toImportCount: 0,
      existingCount: 0,
      error: parsed.error,
    };
  }

  const existingNames = await loadExistingEmployeeNameKeys(company.id);

  const employees = parsed.employees.map((employee) => {
    const alreadyExists = existingNames.has(
      normalizeEmployeeName(employee.fullName)
    );
    return { ...employee, alreadyExists };
  });

  const existingCount = employees.filter((row) => row.alreadyExists).length;

  return {
    employees,
    totalDataRows: parsed.totalDataRows,
    skippedRows: parsed.skippedRows,
    toImportCount: employees.length - existingCount,
    existingCount,
  };
}

export async function importEmployeesFromCsv(
  csvText: string
): Promise<EmployeeImportResult> {
  const { company } = await requireCompanySession();

  const sizeError = assertCsvSize(csvText);
  if (sizeError) {
    return { created: [], skippedExisting: [], failed: [], error: sizeError };
  }

  const preview = await previewEmployeeCsvImport(csvText);
  if (preview.error) {
    return {
      created: [],
      skippedExisting: [],
      failed: [],
      error: preview.error,
    };
  }

  const created: EmployeeImportCreatedRow[] = [];
  const skippedExisting: string[] = [];
  const failed: Array<{ fullName: string; error: string }> = [];

  for (const employee of preview.employees) {
    if (employee.alreadyExists) {
      skippedExisting.push(employee.fullName);
      continue;
    }

    const result = await createEmployeeWithPin(company.id, {
      fullName: employee.fullName,
      position: employee.position,
      hourlyRate: employee.hourlyRate,
    });

    if ("error" in result) {
      failed.push({ fullName: employee.fullName, error: result.error });
      continue;
    }

    created.push({
      id: result.id,
      fullName: result.fullName,
      pin: result.plainPin,
      position: result.position,
    });
  }

  if (created.length > 0) {
    revalidatePath("/employees");
    for (const row of created) {
      revalidatePath(`/employees/${row.id}`);
    }
  }

  return { created, skippedExisting, failed };
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
