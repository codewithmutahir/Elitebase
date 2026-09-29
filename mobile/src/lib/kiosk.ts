import axios from "axios";
import { api, getApiBaseUrl } from "@/lib/api";
import { MOBILE_API } from "@/lib/apiPaths";
import type { KioskEmployee, TabletConfig } from "@/types";

export type RegisterTabletResponse = {
  tablet_token: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  location_name: string;
};

export function toTabletConfig(data: RegisterTabletResponse): TabletConfig {
  return {
    tablet_token: data.tablet_token,
    company_id: data.company_id,
    company_name: data.company_name,
    company_logo_url: data.company_logo_url,
    location_name: data.location_name,
  };
}

export async function registerTablet(
  setupCode: string
): Promise<RegisterTabletResponse> {
  const { data } = await api.post<RegisterTabletResponse>(
    MOBILE_API.kiosk.registerTablet,
    { setup_code: setupCode.trim().toUpperCase() }
  );
  return data;
}

export type GetEmployeeApiEmployee = {
  id: string;
  full_name: string;
  face_registered: boolean;
  face_consent: boolean;
  has_face_descriptor: boolean;
  needs_reenrollment: boolean;
};

export type GetEmployeeResponse = {
  employee: GetEmployeeApiEmployee;
};

export async function getEmployeeByPin(
  pin: string
): Promise<GetEmployeeResponse> {
  const { data } = await api.post<GetEmployeeResponse>(
    MOBILE_API.kiosk.getEmployee,
    { pin: pin.trim() }
  );
  return data;
}

export function toKioskEmployee(
  employee: GetEmployeeApiEmployee,
  companyId: string
): KioskEmployee {
  return {
    id: employee.id,
    full_name: employee.full_name,
    company_id: companyId,
    face_consent: employee.face_consent,
    has_face_descriptor: employee.has_face_descriptor,
    face_registered: employee.face_registered,
    needs_reenrollment: Boolean(employee.needs_reenrollment),
  };
}

export function getPinLookupErrorMessage(error: unknown): string {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return "Server URL is not configured.";
  }

  if (axios.isAxiosError(error)) {
    const apiError =
      typeof error.response?.data === "object" &&
      error.response?.data !== null &&
      "error" in error.response.data &&
      typeof (error.response.data as { error: unknown }).error === "string"
        ? (error.response.data as { error: string }).error
        : null;
    if (!error.response) {
      return "Connection error";
    }
    if (apiError) {
      return apiError;
    }
    if (error.response.status === 404) {
      return "PIN not found. Please try again.";
    }
    if (error.response.status === 401) {
      return "Tablet setup expired. Re-register this device from kiosk setup.";
    }
    if (error.response.status === 403) {
      return "This tablet or employee cannot clock in. Contact your manager.";
    }
  }
  return "Could not verify PIN right now. Please try again.";
}

export function getRegisterFaceErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const base = getApiBaseUrl() || "(no EXPO_PUBLIC_API_URL)";
    if (!error.response) {
      const isTimeout =
        error.code === "ECONNABORTED" ||
        /timeout/i.test(String(error.message ?? ""));
      const code = error.code ? ` [${error.code}]` : "";
      return isTimeout
        ? `Face service timed out${code}. Wait and try again.`
        : `Connection error${code}. Cannot reach ${base}. Check network.`;
    }
    const message = error.response.data;
    if (
      typeof message === "object" &&
      message !== null &&
      "error" in message &&
      typeof (message as { error: unknown }).error === "string"
    ) {
      return (message as { error: string }).error;
    }
    return `Could not register face (HTTP ${error.response.status}).`;
  }
  return "Could not register face. Please try again.";
}

export type EmployeeStatusResponse = {
  employee_id: string;
  is_clocked_in: boolean;
  clocked_in_at: string | null;
  on_break: boolean;
  latest_type: string | null;
};

export async function getEmployeeStatus(
  employeeId: string
): Promise<EmployeeStatusResponse> {
  const { data } = await api.post<EmployeeStatusResponse>(
    MOBILE_API.kiosk.employeeStatus,
    { employee_id: employeeId }
  );
  return data;
}

export type ClockActionType =
  | "clock_in"
  | "clock_out"
  | "break_start"
  | "break_end";

export type ClockActionResponse = {
  attendance: {
    id: string;
    employee_id: string;
    type: ClockActionType;
    timestamp: string;
  };
};

export async function clockAction(
  employeeId: string,
  type: ClockActionType,
  faceMatchScore?: number
): Promise<ClockActionResponse> {
  const { data } = await api.post<ClockActionResponse>(
    MOBILE_API.kiosk.clockAction,
    {
      employee_id: employeeId,
      type,
      ...(faceMatchScore != null ? { face_match_score: faceMatchScore } : {}),
    }
  );
  return data;
}

export function getKioskApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Connection error. Check network and try again.";
    }
    const message = error.response.data;
    if (
      typeof message === "object" &&
      message !== null &&
      "error" in message &&
      typeof (message as { error: unknown }).error === "string"
    ) {
      return (message as { error: string }).error;
    }
  }
  return fallback;
}

export type LeaveRequestResponse = {
  request_id: string;
  status: string;
};

export async function submitLeaveRequest(
  employeeId: string,
  leaveType: "paid_leave" | "unpaid_leave",
  startDate: string,
  endDate?: string,
  reason?: string
): Promise<LeaveRequestResponse> {
  const { data } = await api.post<LeaveRequestResponse>(
    MOBILE_API.kiosk.leaveRequest,
    {
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate || startDate,
      reason: reason || undefined,
    }
  );
  return data;
}

export function getRegisterTabletErrorMessage(error: unknown): string {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return "Server URL is not set. Add EXPO_PUBLIC_API_URL to mobile/.env, then restart Expo (npx expo start -c).";
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Cannot reach ${baseUrl}. Check Wi‑Fi and that the web app is running.`;
    }

    const apiError =
      typeof error.response.data === "object" &&
      error.response.data !== null &&
      "error" in error.response.data &&
      typeof (error.response.data as { error: unknown }).error === "string"
        ? (error.response.data as { error: string }).error
        : null;

    if (apiError) return apiError;

    if (error.response.status === 409) {
      return "This setup code was already used. Generate a new code in the dashboard.";
    }
    if (error.response.status === 403) {
      return "This tablet setup was deactivated. Generate a new code.";
    }
    if (error.response.status === 429) {
      return "Too many attempts. Wait a minute and try again.";
    }
    if (error.response.status >= 500) {
      return "Server error. Try again in a moment or contact support.";
    }

    return "Invalid or expired setup code.";
  }

  return "Could not connect this tablet. Please try again.";
}
