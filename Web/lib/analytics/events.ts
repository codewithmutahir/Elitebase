/** Canonical PostHog event names — keep stringly-typed call sites typo-free. */
export const AnalyticsEvent = {
  employerSignedUp: "employer_signed_up",
  employerLoggedIn: "employer_logged_in",
  onboardingCompleted: "onboarding_completed",
  employeeInvited: "employee_invited",
  portalInviteAccepted: "portal_invite_accepted",
  kioskTabletRegistered: "kiosk_tablet_registered",
  punchSucceeded: "punch_succeeded",
  punchFailed: "punch_failed",
  faceEnrollSucceeded: "face_enroll_succeeded",
  faceEnrollFailed: "face_enroll_failed",
  leaveSubmitted: "leave_submitted",
  leaveCancelled: "leave_cancelled",
  timesheetExported: "timesheet_exported",
  csvImportCompleted: "csv_import_completed",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export type PunchSource = "kiosk" | "portal";
