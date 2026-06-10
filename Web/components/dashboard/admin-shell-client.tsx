"use client";

import { Shield } from "lucide-react";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Sidebar, SidebarInset, type SidebarNavItem } from "@/components/ui/sidebar";

type AdminShellClientProps = {
  children: React.ReactNode;
  companyName: string;
  userEmail: string;
  showSuperAdmin?: boolean;
};

export function AdminShellClient({
  children,
  companyName,
  userEmail,
  showSuperAdmin = false,
}: AdminShellClientProps) {
  const footerItems: SidebarNavItem[] = showSuperAdmin
    ? [{ href: "/super-admin/companies", label: "Super Admin", icon: Shield }]
    : [];

  return (
    <>
      <Sidebar
        companyName={companyName}
        userEmail={userEmail}
        footerItems={footerItems}
        logoutControl={<LogoutButton />}
      />
      <SidebarInset className="bg-slate-50">
        <div className="min-h-screen p-8">{children}</div>
      </SidebarInset>
    </>
  );
}
