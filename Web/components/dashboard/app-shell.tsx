"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/timesheets", label: "Timesheets" },
  { href: "/kiosk-setup", label: "Kiosk Setup" },
  { href: "/settings", label: "Settings" },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  companyName: string;
  userEmail: string;
  showSuperAdmin?: boolean;
};

export function AppShell({
  children,
  companyName,
  userEmail,
  showSuperAdmin = false,
}: AppShellProps) {
  const navItems = showSuperAdmin
    ? [
        ...baseNavItems,
        { href: "/super-admin/companies", label: "Super Admin" },
      ]
    : [...baseNavItems];
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r border-[#E2E8F0] bg-white px-4 py-8 md:block">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
            Elitebase
          </p>
          <p className="mt-1 truncate px-3 text-sm font-semibold">{companyName}</p>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#DBEAFE] text-[#1D4ED8]"
                      : "text-[#334155] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto px-3 pt-10 text-xs text-[#64748B]">{userEmail}</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[#E2E8F0] bg-white px-6 py-4 md:hidden">
            <p className="text-sm font-semibold">{companyName}</p>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full px-3 py-1 font-semibold ${
                      active
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#F1F5F9] text-[#334155]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
