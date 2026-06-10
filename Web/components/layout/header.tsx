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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-6">
      <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>

      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-700">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              companyInitials(company.name)
            )}
          </div>
          <span className="max-w-[140px] truncate text-sm font-medium text-slate-900">
            {company.name}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                )}
                aria-label="Account menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-slate-900">
                {user.name || "Account"}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <User className="size-4" aria-hidden />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="size-4" aria-hidden />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
