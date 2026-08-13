"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Tablet,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompany } from "@/contexts/company-context";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-expanded";
const SCHEDULE_OPEN_KEY = "sidebar-schedule-open";
const TEAM_OPEN_KEY = "sidebar-team-open";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kiosk-setup", label: "Kiosk Setup", icon: Tablet },
  { href: "/settings", label: "Settings", icon: Settings },
];

const teamSubItems: Omit<NavItem, "icon">[] = [
  { href: "/employees", label: "Roster" },
  { href: "/team/time-off", label: "Time Off" },
];

const scheduleSubItems: Omit<NavItem, "icon">[] = [
  { href: "/schedule/schedule", label: "Schedule" },
  { href: "/schedule/departments", label: "Departments & Roles" },
  { href: "/schedule/availability", label: "Team Availability" },
  { href: "/timesheets", label: "Timesheets" },
];

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

export function Sidebar() {
  const pathname = usePathname();
  const { company, user, isSuperAdmin } = useCompany();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isWide = pinned || hovered;
  const initials = userInitials(user.name, user.email);
  const companyAbbr = companyInitials(company.name);

  const scheduleActive = scheduleSubItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const teamActive =
    pathname === "/employees" ||
    pathname.startsWith("/employees/") ||
    pathname.startsWith("/team/");

  useEffect(() => {
    setMounted(true);
    setPinned(window.localStorage.getItem(STORAGE_KEY) === "true");
    const storedSchedule = window.localStorage.getItem(SCHEDULE_OPEN_KEY);
    if (storedSchedule !== null) {
      setScheduleOpen(storedSchedule === "true");
    } else {
      setScheduleOpen(scheduleActive);
    }
    const storedTeam = window.localStorage.getItem(TEAM_OPEN_KEY);
    if (storedTeam !== null) {
      setTeamOpen(storedTeam === "true");
    } else {
      setTeamOpen(teamActive);
    }
  }, [scheduleActive, teamActive]);

  useEffect(() => {
    if (scheduleActive) {
      setScheduleOpen(true);
    }
  }, [scheduleActive]);

  useEffect(() => {
    if (teamActive) {
      setTeamOpen(true);
    }
  }, [teamActive]);

  const setPinnedState = useCallback((value: boolean) => {
    setPinned(value);
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  }, []);

  const toggleSchedule = useCallback(() => {
    setScheduleOpen((open) => {
      const next = !open;
      window.localStorage.setItem(SCHEDULE_OPEN_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  const toggleTeam = useCallback(() => {
    setTeamOpen((open) => {
      const next = !open;
      window.localStorage.setItem(TEAM_OPEN_KEY, next ? "true" : "false");
      return next;
    });
  }, []);

  const expandAndOpenTeam = useCallback(() => {
    setPinnedState(true);
    setTeamOpen(true);
    window.localStorage.setItem(TEAM_OPEN_KEY, "true");
  }, [setPinnedState]);

  const expandAndOpenSchedule = useCallback(() => {
    setPinnedState(true);
    setScheduleOpen(true);
    window.localStorage.setItem(SCHEDULE_OPEN_KEY, "true");
  }, [setPinnedState]);

  const handleTeamParentClick = useCallback(() => {
    if (!isWide) {
      expandAndOpenTeam();
      return;
    }
    toggleTeam();
  }, [isWide, expandAndOpenTeam, toggleTeam]);

  const handleScheduleParentClick = useCallback(() => {
    if (!isWide) {
      expandAndOpenSchedule();
      return;
    }
    toggleSchedule();
  }, [isWide, expandAndOpenSchedule, toggleSchedule]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  function renderNavItem(item: NavItem, indented = false) {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkClassName = cn(
      "flex h-11 items-center rounded-lg text-sm font-medium transition-colors",
      isWide ? "w-full gap-3 px-3" : "w-11 justify-center",
      indented && isWide && "ml-6 h-10 w-[calc(100%-1.5rem)] px-3",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    const linkContent = (
      <>
        {Icon ? (
          <Icon
            className={cn(
              "size-5 shrink-0",
              active ? "text-blue-600" : "text-slate-500"
            )}
            strokeWidth={active ? 2.5 : 2}
            aria-hidden
          />
        ) : (
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              active ? "bg-blue-600" : "bg-slate-300"
            )}
            aria-hidden
          />
        )}
        <AnimatePresence initial={false}>
          {isWide ? (
            <motion.span
              key={`label-${item.href}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="truncate"
            >
              {item.label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </>
    );

    if (isWide) {
      return (
        <li key={item.href}>
          <Link href={item.href} className={linkClassName}>
            {linkContent}
          </Link>
        </li>
      );
    }

    return (
      <li key={item.href}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link href={item.href} className={linkClassName} aria-label={item.label} />
            }
          >
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </li>
    );
  }

  function renderScheduleSubItem(item: Omit<NavItem, "icon">) {
    const active = isActive(item.href);
    const linkClassName = cn(
      "flex h-10 items-center gap-2 rounded-lg text-sm font-medium transition-colors",
      "ml-6 w-[calc(100%-1.5rem)] px-3",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    return (
      <li key={item.href}>
        <Link href={item.href} className={linkClassName}>
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              active ? "bg-blue-600" : "bg-slate-300"
            )}
            aria-hidden
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  }

  function renderTeamSubItem(item: Omit<NavItem, "icon">) {
    const active =
      item.href === "/employees"
        ? pathname === "/employees" || pathname.startsWith("/employees/")
        : isActive(item.href);
    const linkClassName = cn(
      "flex h-10 items-center gap-2 rounded-lg text-sm font-medium transition-colors",
      "ml-6 w-[calc(100%-1.5rem)] px-3",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    return (
      <li key={item.href}>
        <Link href={item.href} className={linkClassName}>
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              active ? "bg-blue-600" : "bg-slate-300"
            )}
            aria-hidden
          />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  }

  function renderTeamSection() {
    const parentActive = teamActive;
    const parentClassName = cn(
      "flex h-11 w-full items-center rounded-lg text-sm font-medium transition-colors",
      isWide ? "gap-3 px-3" : "w-11 justify-center",
      parentActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    const parentInner = (
      <>
        <Users
          className={cn(
            "size-5 shrink-0",
            parentActive ? "text-blue-600" : "text-slate-500"
          )}
          strokeWidth={parentActive ? 2.5 : 2}
          aria-hidden
        />
        {isWide ? (
          <>
            <span className="flex-1 truncate text-left">Team</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-slate-400 transition-transform duration-200",
                teamOpen && "rotate-180"
              )}
              aria-hidden
            />
          </>
        ) : null}
      </>
    );

    return (
      <li>
        {isWide ? (
          <button
            type="button"
            onClick={handleTeamParentClick}
            className={parentClassName}
            aria-expanded={teamOpen}
          >
            {parentInner}
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleTeamParentClick}
                  className={parentClassName}
                  aria-label="Team"
                  aria-expanded={teamOpen}
                >
                  {parentInner}
                </button>
              }
            />
            <TooltipContent side="right">Team</TooltipContent>
          </Tooltip>
        )}

        <AnimatePresence initial={false}>
          {teamOpen && isWide ? (
            <motion.ul
              key="team-sub"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-1 space-y-0.5 overflow-hidden"
            >
              {teamSubItems.map((item) => renderTeamSubItem(item))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    );
  }

  function renderScheduleSection() {
    const parentActive = scheduleActive;

    const parentClassName = cn(
      "flex h-11 w-full items-center rounded-lg text-sm font-medium transition-colors",
      isWide ? "gap-3 px-3" : "w-11 justify-center",
      parentActive
        ? "bg-blue-50 text-blue-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

    const parentInner = (
      <>
        <CalendarDays
          className={cn(
            "size-5 shrink-0",
            parentActive ? "text-blue-600" : "text-slate-500"
          )}
          strokeWidth={parentActive ? 2.5 : 2}
          aria-hidden
        />
        {isWide ? (
          <>
            <span className="flex-1 truncate text-left">Schedule</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-slate-400 transition-transform duration-200",
                scheduleOpen && "rotate-180"
              )}
              aria-hidden
            />
          </>
        ) : null}
      </>
    );

    return (
      <li>
        {isWide ? (
          <button
            type="button"
            onClick={handleScheduleParentClick}
            className={parentClassName}
            aria-expanded={scheduleOpen}
          >
            {parentInner}
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleScheduleParentClick}
                  className={parentClassName}
                  aria-label="Schedule"
                  aria-expanded={scheduleOpen}
                >
                  {parentInner}
                </button>
              }
            />
            <TooltipContent side="right">Schedule</TooltipContent>
          </Tooltip>
        )}

        <AnimatePresence initial={false}>
          {scheduleOpen && isWide ? (
            <motion.ul
              key="schedule-sub"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-1 space-y-0.5 overflow-hidden"
            >
              {scheduleSubItems.map((item) => renderScheduleSubItem(item))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    );
  }

  const superAdminItem: NavItem = {
    href: "/super-admin/companies",
    label: "Super Admin",
    icon: ShieldCheck,
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white transition-[width] duration-300 ease-in-out",
        isWide ? "w-[240px]" : "w-[64px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={() => setPinnedState(!pinned)}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-slate-100 px-3 py-4",
          isWide ? "gap-3" : "justify-center"
        )}
      >
        {company.logo_url ? (
          <div className="relative size-10 shrink-0">
            <Image
              src={company.logo_url}
              alt={`${company.name} logo`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
            {companyAbbr}
          </div>
        )}
        <AnimatePresence initial={false}>
          {isWide ? (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-sm font-bold text-slate-900">
                {company.name}
              </p>
              <p className="text-xs font-medium text-slate-500">Elitebase</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <ul className="space-y-1">
          {renderNavItem(mainNav[0])}
          {renderTeamSection()}
          {renderScheduleSection()}
          {mainNav.slice(1).map((item) => renderNavItem(item))}
        </ul>

        {isSuperAdmin ? (
          <>
            <Separator className="my-3" />
            <ul className="space-y-1">{renderNavItem(superAdminItem)}</ul>
          </>
        ) : null}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-slate-100 p-2",
          isWide ? "px-2" : "flex justify-center"
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => setPinnedState(!pinned)}
                className={cn(
                  "flex items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
                  isWide ? "h-9 w-full gap-2 px-3" : "size-9"
                )}
                aria-label={pinned ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isWide ? (
                  <>
                    <ChevronLeft className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate text-left text-sm font-medium">
                      Collapse
                    </span>
                  </>
                ) : (
                  <ChevronRight className="size-4" aria-hidden />
                )}
              </button>
            }
          />
          {!isWide ? (
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          ) : null}
        </Tooltip>
      </div>

      <div
        className={cn(
          "shrink-0 border-t border-slate-100 p-2",
          isWide ? "px-3 py-3" : "flex justify-center py-3"
        )}
      >
        {isWide ? (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name || "Account"}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-500"
              aria-label="Log out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={user.email}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-700">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
            <TooltipContent side="right">
              <p className="font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {mounted && !pinned ? (
        <span className="sr-only">
          Double-click sidebar to pin expanded. Hover to expand temporarily.
        </span>
      ) : null}
    </aside>
  );
}
