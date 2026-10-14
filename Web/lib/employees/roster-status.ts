import type { EmployeeStatus } from "@/lib/employees/profile-queries";

export type RosterOnboardingStatus =
  | "deactivated"
  | "needs_contact"
  | "needs_invite"
  | "pending"
  | "active";

type RosterStatusInput = {
  status: EmployeeStatus;
  email: string | null;
  phone: string | null;
  portal_invited_at: string | null;
  /** Set when the employee accepted a portal invite. */
  user_id?: string | null;
};

/**
 * Portal access is email-gated. Status is independent of wage/phone.
 * Only `user_id` means they finished registration; `portal_invited_at` alone is still pending.
 */
export function getRosterOnboardingStatus(
  employee: RosterStatusInput
): RosterOnboardingStatus {
  if (employee.status === "terminated") return "deactivated";

  // Accepted invite — linked Better Auth user.
  if (employee.user_id) return "active";

  const email = employee.email?.trim() ?? "";

  // Invite emails require an address; phone alone cannot activate the portal.
  if (!email) return "needs_contact";
  if (!employee.portal_invited_at) return "needs_invite";
  return "pending";
}

export function rosterStatusLabel(status: RosterOnboardingStatus): string {
  switch (status) {
    case "deactivated":
      return "Deactivated";
    case "needs_contact":
      return "Needs email";
    case "needs_invite":
      return "Needs invite";
    case "pending":
      return "Invite pending";
    case "active":
      return "Active";
  }
}

export function rosterStatusTone(
  status: RosterOnboardingStatus
): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "deactivated":
      return "error";
    case "needs_contact":
    case "needs_invite":
      return "error";
    case "pending":
      // Waiting on the employee — not registered yet.
      return "warning";
    case "active":
      return "success";
  }
}

export function formatAccessLevel(employmentType: string): string {
  switch (employmentType) {
    case "manager":
      return "Manager";
    case "contractor":
      return "Contractor";
    default:
      return "Employee";
  }
}
