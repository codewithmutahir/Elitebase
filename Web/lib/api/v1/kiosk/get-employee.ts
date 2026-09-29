import { NextRequest } from "next/server";
import {
  isErrorResponse,
  jsonError,
  jsonOk,
  parseJsonBody,
  requireKioskTablet,
} from "@/lib/kiosk/api";
import { findEmployeeByPin } from "@/lib/kiosk/employee-lookup";

export const runtime = "nodejs";

type GetEmployeeBody = {
  pin?: string;
};

export async function POST(request: NextRequest) {
  const tablet = await requireKioskTablet(request);
  if (isErrorResponse(tablet)) return tablet;

  const body = await parseJsonBody<GetEmployeeBody>(request);
  if (body instanceof Response) return body;

  const pin = String(body.pin ?? "").trim();
  if (!pin) {
    return jsonError("pin is required.", 400);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[kiosk/get-employee] request", {
      tabletId: tablet.id,
      companyId: tablet.company_id,
      pinLength: pin.length,
      pinMasked:
        pin.length <= 2
          ? `${pin[0] ?? "*"}*`
          : `${pin.slice(0, 1)}${"*".repeat(Math.max(1, pin.length - 2))}${pin.slice(-1)}`,
    });
  }

  const result = await findEmployeeByPin(tablet.company_id, pin);

  if (process.env.NODE_ENV !== "production") {
    console.info("[kiosk/get-employee] result", {
      tabletId: tablet.id,
      companyId: tablet.company_id,
      error: "error" in result ? result.error : null,
      employeeId:
        "employee" in result && result.employee
          ? result.employee.id
          : null,
    });
  }

  if (result.error === "invalid_pin") {
    return jsonError("PIN must be 4–6 digits.", 400);
  }

  if (result.error === "lookup_failed") {
    return jsonError("Could not look up employee.", 500);
  }

  if (result.error === "inactive") {
    return jsonError(
      "This employee is terminated and cannot clock in. Ask your manager to reactivate them.",
      403
    );
  }

  if (result.error === "not_found") {
    return jsonError("Invalid PIN.", 404);
  }

  return jsonOk({ employee: result.employee });
}
