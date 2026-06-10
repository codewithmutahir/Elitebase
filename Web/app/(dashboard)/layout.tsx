import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CompanyProvider } from "@/contexts/company-context";
import { auth } from "@/lib/auth";
import { getCompanyByOwnerId } from "@/lib/company";
import { isSuperAdmin } from "@/lib/super-admin/access";

export const revalidate = 60;

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const company = await getCompanyByOwnerId(session.user.id);

  if (!company) {
    redirect("/onboarding");
  }

  return (
    <CompanyProvider
      value={{
        company,
        user: {
          id: session.user.id,
          name: session.user.name ?? "",
          email: session.user.email,
        },
        isSuperAdmin: isSuperAdmin(session.user.email),
      }}
    >
      <DashboardShell>{children}</DashboardShell>
    </CompanyProvider>
  );
}
