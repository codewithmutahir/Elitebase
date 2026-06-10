import { createClient } from "@/lib/supabase/server";
import {
  hashEmployeePin,
  isBcryptHash,
  verifyEmployeePin,
} from "@/lib/employees/pin";

type PinRow = {
  employee_id: string;
  pin: string;
  pin_plain: string | null;
  employees: {
    id: string;
    full_name: string;
    is_active: boolean;
    face_descriptor: unknown;
    face_consent: boolean;
    face_registered_at: string | null;
  } | {
    id: string;
    full_name: string;
    is_active: boolean;
    face_descriptor: unknown;
    face_consent: boolean;
    face_registered_at: string | null;
  }[] | null;
};

const isDev = process.env.NODE_ENV !== "production";

function maskPin(pin: string) {
  if (!pin) return "";
  if (pin.length <= 2) return `${pin[0] ?? "*"}*`;
  return `${pin.slice(0, 1)}${"*".repeat(Math.max(1, pin.length - 2))}${pin.slice(-1)}`;
}

function normalizeEmployee(
  employees: PinRow["employees"]
): PinRow["employees"] extends (infer E)[] | infer E ? E : never {
  if (!employees) return null as never;
  if (Array.isArray(employees)) return employees[0] as never;
  return employees as never;
}

async function pinMatchesRow(enteredPin: string, row: PinRow) {
  if (await verifyEmployeePin(enteredPin, row.pin)) {
    return { matches: true, needsRehash: !isBcryptHash(row.pin) };
  }

  // Admin UI shows pin_plain; re-sync if hash drifted (e.g. manual DB edit).
  if (row.pin_plain && row.pin_plain === enteredPin) {
    return { matches: true, needsRehash: true };
  }

  return { matches: false, needsRehash: false };
}

export async function findEmployeeByPin(companyId: string, pin: string) {
  const normalizedPin = pin.trim();
  if (isDev) {
    console.info("[kiosk/findEmployeeByPin] start", {
      companyId,
      pinLength: normalizedPin.length,
      pinMasked: maskPin(normalizedPin),
    });
  }
  if (!/^\d{4,6}$/.test(normalizedPin)) {
    return { error: "invalid_pin" as const };
  }

  const admin = createClient();
  const { data, error } = await admin
    .from("employee_pins")
    .select(
      `
      employee_id,
      pin,
      pin_plain,
      employees (
        id,
        full_name,
        is_active,
        face_descriptor,
        face_consent,
        face_registered_at
      )
    `
    )
    .eq("company_id", companyId);

  if (error) {
    console.error("findEmployeeByPin failed:", error.message);
    return { error: "lookup_failed" as const };
  }

  const rows = (data ?? []) as PinRow[];
  let inactivePinMatch = false;
  if (isDev) {
    console.info("[kiosk/findEmployeeByPin] rows loaded", {
      companyId,
      rowCount: rows.length,
    });
  }

  for (const row of rows) {
    const employee = normalizeEmployee(row.employees);
    const { matches, needsRehash } = await pinMatchesRow(normalizedPin, row);
    if (!matches) continue;

    if (!employee?.is_active) {
      if (isDev) {
        console.warn("[kiosk/findEmployeeByPin] inactive employee PIN match", {
          companyId,
          employeeId: row.employee_id,
        });
      }
      inactivePinMatch = true;
      continue;
    }

    if (needsRehash) {
      const pinHash = await hashEmployeePin(normalizedPin);
      const { error: syncError } = await admin
        .from("employee_pins")
        .update({ pin: pinHash, pin_plain: normalizedPin })
        .eq("employee_id", row.employee_id)
        .eq("company_id", companyId);

      if (syncError) {
        console.error("findEmployeeByPin rehash failed:", syncError.message);
      }
    }

    const hasFaceDescriptor = employee.face_descriptor != null;
    if (isDev) {
      console.info("[kiosk/findEmployeeByPin] match found", {
        companyId,
        employeeId: employee.id,
        needsRehash,
      });
    }

    return {
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        face_registered: Boolean(employee.face_registered_at),
        face_consent: employee.face_consent,
        has_face_descriptor: hasFaceDescriptor,
      },
    };
  }

  if (inactivePinMatch) {
    return { error: "inactive" as const };
  }

  if (isDev) {
    console.warn("[kiosk/findEmployeeByPin] no match", {
      companyId,
      rowCount: rows.length,
      pinLength: normalizedPin.length,
      pinMasked: maskPin(normalizedPin),
    });
  }
  return { error: "not_found" as const };
}

export async function getEmployeeForTablet(
  companyId: string,
  employeeId: string
) {
  const admin = createClient();
  const { data, error } = await admin
    .from("employees")
    .select(
      "id, full_name, is_active, face_descriptor, face_consent, face_registered_at"
    )
    .eq("company_id", companyId)
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getLatestAttendanceType(
  companyId: string,
  employeeId: string
) {
  const admin = createClient();
  const { data, error } = await admin
    .from("attendance")
    .select("type")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestAttendanceType failed:", error.message);
    return null;
  }

  return data?.type ?? null;
}
