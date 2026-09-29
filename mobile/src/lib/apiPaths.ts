/** Canonical Elitebase REST paths (keep in sync with Web/lib/api/paths.ts). */
const API_V1 = "/api/v1";

export const MOBILE_API = {
  kiosk: {
    registerTablet: `${API_V1}/kiosk/register-tablet`,
    getEmployee: `${API_V1}/kiosk/get-employee`,
    employeeStatus: `${API_V1}/kiosk/employee-status`,
    clockAction: `${API_V1}/kiosk/clock-action`,
    leaveRequest: `${API_V1}/kiosk/leave-request`,
    validateTablet: `${API_V1}/kiosk/validate-tablet`,
    faceVerifyLog: `${API_V1}/kiosk/face-verify-log`,
    faceWarmup: `${API_V1}/kiosk/face-warmup`,
    registerFace: `${API_V1}/kiosk/register-face`,
    verifyFace: `${API_V1}/kiosk/verify-face`,
  },
} as const;

export function isKioskApiUrl(url: string): boolean {
  return url.includes("/api/v1/kiosk/") || url.includes("/api/kiosk/");
}

export function isKioskAuthUrl(url: string): boolean {
  return isKioskApiUrl(url) && !url.includes("/register-tablet");
}
