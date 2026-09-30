import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CompanyProvider } from "@/contexts/company-context";
import { requireCompanySession } from "@/lib/employees/session";
import { isSuperAdmin } from "@/lib/super-admin/access";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, user } = await requireCompanySession();

  return (
    <CompanyProvider
      value={{
        company,
        user,
        isSuperAdmin: isSuperAdmin(user.email),
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </CompanyProvider>
  );
}
