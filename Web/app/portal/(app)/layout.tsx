import { MuiProvider } from "@/components/providers/mui-provider";
import { PortalShell } from "@/components/portal/portal-shell";
import { DashboardThemeProvider } from "@/contexts/dashboard-theme-context";
import { requireEmployeeSession } from "@/lib/portal/session";

export default async function EmployeePortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { employee, user } = await requireEmployeeSession();

  return (
    <MuiProvider defaultMode="light">
      <DashboardThemeProvider layout="fill">
        <PortalShell
          employeeName={user.name || employee.full_name}
          companyName={employee.company_name}
        >
          {children}
        </PortalShell>
      </DashboardThemeProvider>
    </MuiProvider>
  );
}
