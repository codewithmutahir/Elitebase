import { AnalyticsIdentify } from "@/components/analytics/analytics-identify";
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
        <AnalyticsIdentify
          distinctId={`emp_${employee.id}`}
          properties={{
            companyId: employee.company_id,
            surface: "portal",
            userId: user.id,
          }}
        />
        <PortalShell
          employeeName={user.name || employee.full_name}
          companyName={employee.company_name}
          companyLogoUrl={employee.company_logo_url}
        >
          {children}
        </PortalShell>
      </DashboardThemeProvider>
    </MuiProvider>
  );
}
