import {
  getCompanyByOwnerId,
  isOwnerCompanySuspended,
} from "@/lib/company";
import { getEmployeeByUserId } from "@/lib/portal/queries";

/** Where to send a user after a successful Better Auth sign-in. */
export async function resolvePostLoginPath(userId: string): Promise<string> {
  const company = await getCompanyByOwnerId(userId);
  if (company) return "/dashboard";

  if (await isOwnerCompanySuspended(userId)) {
    return "/login?error=company_suspended";
  }

  const employee = await getEmployeeByUserId(userId);
  if (employee) {
    if (employee.status === "terminated" || !employee.is_active) {
      return "/login?error=deactivated";
    }
    return "/portal";
  }

  return "/onboarding";
}
