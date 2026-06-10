import { AdminShellClient } from "@/components/dashboard/admin-shell-client";

type AdminShellProps = {
  children: React.ReactNode;
  companyName: string;
  userEmail: string;
  showSuperAdmin?: boolean;
};

export function AdminShell(props: AdminShellProps) {
  return <AdminShellClient {...props} />;
}
