"use client";

import {
  CalendarDays,
  ChevronDown,
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
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme, type Theme } from "@mui/material/styles";
import { muiAlpha } from "@/lib/mui/alpha";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCompany } from "@/contexts/company-context";
import { authClient } from "@/lib/auth-client";

const SCHEDULE_OPEN_KEY = "sidebar-schedule-open";
const TEAM_OPEN_KEY = "sidebar-team-open";

/** Expanded desktop drawer width (matches previous layout shell). */
export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

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
  { href: "/team/benefits", label: "Benefits" },
  { href: "/team/payslips", label: "Payslips" },
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

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Desktop only — controlled by header PanelLeft toggle. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
  expanded = true,
  onExpandedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const { company, user, isSuperAdmin } = useCompany();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isWide = isMobile || expanded;
  const drawerWidth = isWide ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED;
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
    if (scheduleActive) setScheduleOpen(true);
  }, [scheduleActive]);

  useEffect(() => {
    if (teamActive) setTeamOpen(true);
  }, [teamActive]);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  const toggleSchedule = useCallback(() => {
    setScheduleOpen((open) => !open);
  }, []);

  const toggleTeam = useCallback(() => {
    setTeamOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(
      SCHEDULE_OPEN_KEY,
      scheduleOpen ? "true" : "false"
    );
  }, [scheduleOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(TEAM_OPEN_KEY, teamOpen ? "true" : "false");
  }, [teamOpen, mounted]);

  const expandAndOpenTeam = useCallback(() => {
    onExpandedChange?.(true);
    setTeamOpen(true);
    window.localStorage.setItem(TEAM_OPEN_KEY, "true");
  }, [onExpandedChange]);

  const expandAndOpenSchedule = useCallback(() => {
    onExpandedChange?.(true);
    setScheduleOpen(true);
    window.localStorage.setItem(SCHEDULE_OPEN_KEY, "true");
  }, [onExpandedChange]);

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

  const navButtonSx = (active: boolean, indented = false) => ({
    minHeight: indented ? 40 : 44,
    borderRadius: indented ? 999 : 1,
    mx: 0,
    px: isWide ? 1.5 : 0,
    justifyContent: isWide ? "flex-start" : "center",
    ml: indented && isWide ? 3 : 0,
    width: indented && isWide ? "calc(100% - 24px)" : "100%",
    color: active ? "text.primary" : "text.secondary",
    bgcolor: "transparent",
    fontWeight: active ? 600 : 500,
    "&:hover": {
      color: "text.primary",
    },
    "&.Mui-selected": {
      color: "text.primary",
    },
  });

  const iconSx = (active: boolean) => ({
    minWidth: 0,
    mr: isWide ? 1.5 : 0,
    color: active ? "text.primary" : "text.secondary",
    justifyContent: "center",
  });

  function renderNavItem(item: NavItem, indented = false) {
    const active = isActive(item.href);
    const Icon = item.icon;
    const button = (
      <ListItemButton
        key={item.href}
        component={Link}
        href={item.href}
        selected={active}
        aria-label={!isWide ? item.label : undefined}
        onClick={() => {
          if (isMobile) onMobileClose?.();
        }}
        sx={navButtonSx(active, indented)}
      >
        <ListItemIcon sx={iconSx(active)}>
          <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden />
        </ListItemIcon>
        {isWide ? (
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
          />
        ) : null}
      </ListItemButton>
    );

    if (isWide) return button;

    return (
      <Tooltip key={item.href} title={item.label} placement="right">
        {button}
      </Tooltip>
    );
  }

  function renderSubItem(
    item: Omit<NavItem, "icon">,
    activeOverride?: boolean
  ) {
    const active = activeOverride ?? isActive(item.href);
    return (
      <ListItemButton
        key={item.href}
        component={Link}
        href={item.href}
        selected={active}
        onClick={() => {
          if (isMobile) onMobileClose?.();
        }}
        sx={navButtonSx(active, true)}
      >
        <Box
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            flexShrink: 0,
            mr: 1,
            bgcolor: active
              ? "primary.main"
              : muiAlpha(theme, (palette) => palette.text.secondary, 0.45),
          }}
          aria-hidden
        />
        <ListItemText
          primary={item.label}
          slotProps={{
              primary: {
                noWrap: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
        />
      </ListItemButton>
    );
  }

  function renderTeamSection() {
    const parentActive = teamActive;
    const parent = (
      <ListItemButton
        onClick={handleTeamParentClick}
        selected={parentActive}
        aria-expanded={teamOpen}
        aria-label={!isWide ? "Team" : undefined}
        sx={navButtonSx(parentActive)}
      >
        <ListItemIcon sx={iconSx(parentActive)}>
          <Users
            size={20}
            strokeWidth={parentActive ? 2.5 : 2}
            aria-hidden
          />
        </ListItemIcon>
        {isWide ? (
          <>
            <ListItemText
              primary="Team"
              slotProps={{
              primary: {
                noWrap: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            />
            <ChevronDown
              size={16}
              aria-hidden
              style={{
                color: theme.palette.text.secondary,
                transform: teamOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease",
                flexShrink: 0,
              }}
            />
          </>
        ) : null}
      </ListItemButton>
    );

    return (
      <Box component="li" sx={{ listStyle: "none" }}>
        {isWide ? (
          parent
        ) : (
          <Tooltip title="Team" placement="right">
            {parent}
          </Tooltip>
        )}
        <Collapse in={teamOpen && isWide} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ mt: 0.5 }}>
            {teamSubItems.map((item) =>
              renderSubItem(
                item,
                item.href === "/employees"
                  ? pathname === "/employees" ||
                      pathname.startsWith("/employees/")
                  : undefined
              )
            )}
          </List>
        </Collapse>
      </Box>
    );
  }

  function renderScheduleSection() {
    const parentActive = scheduleActive;
    const parent = (
      <ListItemButton
        onClick={handleScheduleParentClick}
        selected={parentActive}
        aria-expanded={scheduleOpen}
        aria-label={!isWide ? "Schedule" : undefined}
        sx={navButtonSx(parentActive)}
      >
        <ListItemIcon sx={iconSx(parentActive)}>
          <CalendarDays
            size={20}
            strokeWidth={parentActive ? 2.5 : 2}
            aria-hidden
          />
        </ListItemIcon>
        {isWide ? (
          <>
            <ListItemText
              primary="Schedule"
              slotProps={{
              primary: {
                noWrap: true,
                sx: { fontSize: "0.875rem", fontWeight: 500 },
              },
            }}
            />
            <ChevronDown
              size={16}
              aria-hidden
              style={{
                color: theme.palette.text.secondary,
                transform: scheduleOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease",
                flexShrink: 0,
              }}
            />
          </>
        ) : null}
      </ListItemButton>
    );

    return (
      <Box component="li" sx={{ listStyle: "none" }}>
        {isWide ? (
          parent
        ) : (
          <Tooltip title="Schedule" placement="right">
            {parent}
          </Tooltip>
        )}
        <Collapse in={scheduleOpen && isWide} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ mt: 0.5 }}>
            {scheduleSubItems.map((item) => renderSubItem(item))}
          </List>
        </Collapse>
      </Box>
    );
  }

  const superAdminItem: NavItem = {
    href: "/super-admin/companies",
    label: "Super Admin",
    icon: ShieldCheck,
  };

  function renderDrawerContent() {
    return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={isWide ? 1.5 : 0}
        sx={{
          flexShrink: 0,
          px: 1.5,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          alignItems: "center",
          justifyContent: isWide ? "flex-start" : "center",
        }}
      >
        {company.logo_url ? (
          <Box sx={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
            <Image
              src={company.logo_url}
              alt={`${company.name} logo`}
              fill
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              width: 36,
              height: 36,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            {companyAbbr}
          </Box>
        )}
        {isWide ? (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              noWrap
              sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}
            >
              {company.name}
            </Typography>
            <Typography
              sx={{ fontSize: "0.75rem", fontWeight: 500, color: "text.secondary" }}
            >
              Elitebase
            </Typography>
          </Box>
        ) : null}
      </Stack>

      <Box
        component="nav"
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          px: 1,
          py: 1.5,
        }}
      >
        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {renderNavItem(mainNav[0])}
          {renderTeamSection()}
          {renderScheduleSection()}
          {mainNav.slice(1).map((item) => renderNavItem(item))}
        </List>

        {isSuperAdmin ? (
          <>
            <Divider sx={{ my: 1.5 }} />
            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {renderNavItem(superAdminItem)}
            </List>
          </>
        ) : null}
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          borderTop: "1px solid",
          borderColor: "divider",
          p: 1,
          px: isWide ? 1.5 : 1,
          py: 1.5,
          display: "flex",
          justifyContent: isWide ? "stretch" : "center",
        }}
      >
        {isWide ? (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ width: "100%", alignItems: "center" }}
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}
              >
                {user.name || "Account"}
              </Typography>
              <Typography noWrap sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {user.email}
              </Typography>
            </Box>
            <IconButton
              type="button"
              onClick={handleSignOut}
              aria-label="Log out"
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "error.main", bgcolor: "action.hover" },
              }}
            >
              <LogOut size={16} aria-hidden />
            </IconButton>
          </Stack>
        ) : (
          <Tooltip
            title={
              <Box>
                <Typography sx={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                  {user.name || user.email}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  {user.email}
                </Typography>
              </Box>
            }
            placement="right"
          >
            <IconButton
              type="button"
              aria-label={user.email}
              sx={{ p: 0 }}
            >
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
    );
  }

  const paperSx = {
    width: drawerWidth,
    boxSizing: "border-box" as const,
    borderRight: "1px solid",
    borderColor: "divider",
    bgcolor: (t: Theme) =>
      muiAlpha(t, (palette) => palette.background.paper, 0.95),
    backdropFilter: "blur(12px)",
    backgroundImage: "none",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.standard,
    }),
    overflowX: "hidden" as const,
  };

  return isMobile ? (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": {
          ...paperSx,
          width: SIDEBAR_WIDTH,
        },
      }}
    >
      {renderDrawerContent()}
    </Drawer>
  ) : (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          ...paperSx,
          position: "sticky",
          top: 0,
          height: "100vh",
        },
      }}
    >
      {renderDrawerContent()}
    </Drawer>
  );
}
