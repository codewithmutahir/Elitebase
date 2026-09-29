import { apiV1Path } from "./version";

/** Canonical v1 paths for clients (web, mobile, future public API). */
export const API_V1 = {
  kiosk: {
    clockAction: apiV1Path("kiosk/clock-action"),
    leaveRequest: apiV1Path("kiosk/leave-request"),
    registerTablet: apiV1Path("kiosk/register-tablet"),
    verifyFace: apiV1Path("kiosk/verify-face"),
    registerFace: apiV1Path("kiosk/register-face"),
    faceWarmup: apiV1Path("kiosk/face-warmup"),
    faceVerifyLog: apiV1Path("kiosk/face-verify-log"),
    validateTablet: apiV1Path("kiosk/validate-tablet"),
    getEmployee: apiV1Path("kiosk/get-employee"),
    employeeStatus: apiV1Path("kiosk/employee-status"),
  },
  timesheets: {
    export: apiV1Path("timesheets/export"),
    months: apiV1Path("timesheets/months"),
  },
} as const;

/** Legacy unversioned paths — kept for backward compatibility; prefer `API_V1`. */
export const API_LEGACY = {
  kioskPrefix: "/api/kiosk",
  timesheetsPrefix: "/api/timesheets",
  authPrefix: "/api/auth",
} as const;

export function isKioskApiPath(pathname: string): boolean {
  return parseKioskRouteSegment(pathname) !== null;
}

export function parseKioskRouteSegment(pathname: string): string | null {
  const match = pathname.match(/^\/api\/(?:v1\/)?kiosk\/([^/]+)$/);
  return match?.[1] ?? null;
}
