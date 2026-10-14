import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server-session";
import { getCompanyByOwnerId } from "@/lib/company";
import {
  getEmployeeByUserId,
  type PortalEmployee,
} from "@/lib/portal/queries";

export type EmployeePortalSession = {
  userId: string;
  user: { id: string; name: string; email: string };
  employee: PortalEmployee;
};

/** Auth + employee roster link; redirects employers to the company dashboard. */
export const requireEmployeeSession = cache(
  async (): Promise<EmployeePortalSession> => {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      redirect("/login");
    }

    const employee = await getEmployeeByUserId(session.user.id);

    if (!employee) {
      const company = await getCompanyByOwnerId(session.user.id);
      if (company) {
        redirect("/dashboard");
      }
      redirect("/login?error=not_employee");
    }

    if (employee.status === "terminated" || !employee.is_active) {
      redirect("/login?error=deactivated");
    }

    // getEmployeeByUserId already returns null for suspended companies;
    // keep an explicit deactivated redirect if company flags change mid-session.

    return {
      userId: session.user.id,
      user: {
        id: session.user.id,
        name: session.user.name ?? employee.full_name,
        email: session.user.email,
      },
      employee,
    };
  }
);
