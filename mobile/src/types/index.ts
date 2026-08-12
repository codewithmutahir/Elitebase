/** Employee payload used across kiosk flow (from get-employee API). */
export interface KioskEmployee {
  id: string;
  full_name: string;
  company_id: string;
  face_consent: boolean;
  has_face_descriptor: boolean;
  face_registered: boolean;
  /** True when face must be re-scanned after model change. */
  needs_reenrollment: boolean;
}

export interface TabletConfig {
  tablet_token: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  location_name: string;
}

export type AttendanceActionType =
  | "clock_in"
  | "clock_out"
  | "break_start"
  | "break_end";

export type RootStackParamList = {
  Setup: undefined;
  Idle: undefined;
  Pin: undefined;
  Consent: { employee: KioskEmployee };
  FaceRegister: { employee: KioskEmployee };
  FaceScan: { employee: KioskEmployee };
  Action: { employee: KioskEmployee; matchScore?: number };
  Success: {
    employee: KioskEmployee;
    actionType: AttendanceActionType;
    timestamp: string;
  };
};
