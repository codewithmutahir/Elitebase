"use client";

import { LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompany } from "@/contexts/company-context";
import { authClient } from "@/lib/auth-client";
import { DashboardThemeToggle } from "@/components/layout/dashboard-theme-toggle";
import {
  dashboardDropdownContentClass,
  dashboardDropdownItemClass,
  dashboardDropdownLabelClass,
  dashboardDropdownMetaClass,
} from "@/lib/dashboard/styles";
import { getPageTitle } from "@/lib/layout/page-titles";
import { cn } from "@/lib/utils";

function userInitials(name: string, email: string) {
  const fromName = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (fromName.length >= 2) return fromName;
  return email.slice(0, 2).toUpperCase();
}

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const { company, user } = useCompany();
  const title = getPageTitle(pathname);
  const initials = userInitials(user.name, user.email);

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--eb-border)] bg-[var(--eb-surface)]/80 px-6 backdrop-blur-md">
      <h1 className="truncate text-lg font-medium tracking-tight text-[var(--eb-text)]">
        {title}
      </h1>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <DashboardThemeToggle />
        <div className="hidden items-center gap-2 sm:flex">
          {company.logo_url ? (
            <div className="relative size-8 shrink-0">
              <Image
                src={company.logo_url}
                alt={`${company.name} logo`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-xs font-bold text-[var(--eb-accent)]">
              {companyInitials(company.name)}
            </div>
          )}
          <span className="max-w-[140px] truncate text-sm font-medium text-[var(--eb-text)]">
            {company.name}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--eb-ink)]"
                )}
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-xs font-semibold text-[var(--eb-text)]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={8}
            className={dashboardDropdownContentClass}
          >
            <div className="border-b border-[var(--eb-border)] px-2 py-2">
              <p className={dashboardDropdownLabelClass}>
                {user.name || "Account"}
              </p>
              <p className={dashboardDropdownMetaClass}>{user.email}</p>
            </div>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link href="/settings" className="flex w-full items-center gap-2" />
              }
            >
              <User className="size-4 shrink-0" aria-hidden />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className={dashboardDropdownItemClass}
              render={
                <Link href="/settings" className="flex w-full items-center gap-2" />
              }
            >
              <Settings className="size-4 shrink-0" aria-hidden />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--eb-border)]" />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 rounded-md px-2 py-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
