import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { auth } from "@/lib/auth";
import { getCompanyByOwnerId } from "@/lib/company";
import { isSuperAdmin } from "@/lib/super-admin/access";

export async function AdminLayout({
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
    <AdminShell
      companyName={company.name}
      userEmail={session.user.email}
      showSuperAdmin={isSuperAdmin(session.user.email)}
    >
      {children}
    </AdminShell>
  );
}
