"use client";

import {
  Clock,
  LayoutDashboard,
  Settings,
  Tablet,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const SIDEBAR_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/timesheets", label: "Timesheets", icon: Clock },
  { href: "/kiosk-setup", label: "Kiosk Setup", icon: Tablet },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export type SidebarNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

export type SidebarProps = {
  logo?: ReactNode;
  companyName?: string;
  navItems?: SidebarNavItem[];
  userEmail: string;
  footerItems?: SidebarNavItem[];
  logoutControl?: ReactNode;
  className?: string;
};

export function Sidebar({
  logo,
  companyName,
  navItems = [...SIDEBAR_NAV_ITEMS],
  userEmail,
  footerItems = [],
  logoutControl,
  className,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderNavLink(item: SidebarNavItem) {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          active
            ? "bg-blue-50 text-blue-600"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
        {item.label}
      </Link>
    );
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-slate-100 bg-white",
        className
      )}
    >
      <div className="border-b border-slate-100 px-5 py-5">
        {logo ?? (
          <p className="text-lg font-bold tracking-tight text-blue-600">
            Elitebase
          </p>
        )}
        {companyName ? (
          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {companyName}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(renderNavLink)}

        {footerItems.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {footerItems.map(renderNavLink)}
          </div>
        ) : null}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="truncate text-xs text-slate-500">{userEmail}</p>
        {logoutControl}
      </div>
    </aside>
  );
}

/** Offset main content beside the fixed 240px sidebar. */
export function SidebarInset({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("min-h-screen pl-60", className)}>{children}</div>;
}
