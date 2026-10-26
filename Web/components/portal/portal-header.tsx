"use client";

import { LogOut, Menu, PanelLeft } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { muiAlpha } from "@/lib/mui/alpha";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardThemeToggle } from "@/components/layout/dashboard-theme-toggle";
import { HeaderNavProgress } from "@/components/navigation/header-nav-progress";
import { usePortalNav } from "@/contexts/portal-nav-context";
import {
  dashboardDropdownContentClass,
  dashboardDropdownHeaderClass,
  dashboardDropdownItemClass,
  dashboardDropdownLabelClass,
  dashboardDropdownMenuSectionClass,
  dashboardDropdownMetaClass,
} from "@/lib/dashboard/styles";
import { getPortalPageTitle } from "@/lib/layout/page-titles";
type PortalHeaderProps = {
  employeeName: string;
  companyName: string;
  companyLogoUrl: string | null;
  onMenuClick: () => void;
  sidebarExpanded: boolean;
  onSidebarToggle: () => void;
};

function userInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "E"
  );
}

function companyInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "C"
  );
}

export function PortalHeader({
  employeeName,
  companyName,
  companyLogoUrl,
  onMenuClick,
  sidebarExpanded,
  onSidebarToggle,
}: PortalHeaderProps) {
  const pathname = usePathname();
  const { pending: portalNavPending, pendingHref } = usePortalNav();
  const titlePath = (() => {
    if (!portalNavPending || !pendingHref) return pathname;
    try {
      return new URL(pendingHref, "http://local.invalid").pathname;
    } catch {
      return pendingHref.split("?")[0] || pathname;
    }
  })();
  const title = getPortalPageTitle(titlePath);

  function handleSignOut() {
    void import("@/lib/analytics/sign-out").then(({ signOutAndResetAnalytics }) => {
      signOutAndResetAnalytics();
    });
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      className="portal-print-hide"
      sx={{
        position: "sticky",
        zIndex: 30,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) =>
          muiAlpha(theme, (palette) => palette.background.paper, 0.8),
        backdropFilter: "blur(12px)",
        color: "text.primary",
        "@media print": { display: "none !important" },
      }}
    >
      <HeaderNavProgress force={portalNavPending} />
      <Toolbar
        disableGutters
        sx={{
          minHeight: 56,
          height: 56,
          px: 3,
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center" }}>
          <IconButton
            type="button"
            edge="start"
            aria-label="Open navigation"
            onClick={onMenuClick}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <Menu size={20} aria-hidden />
          </IconButton>
          <Tooltip
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <IconButton
              type="button"
              edge="start"
              aria-label={
                sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
              }
              aria-pressed={sidebarExpanded}
              onClick={onSidebarToggle}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                borderRadius: "8px",
                border: "1px solid",
                borderColor: "divider",
                color: "text.secondary",
                bgcolor: (theme) =>
                  muiAlpha(theme, (p) => p.text.primary, 0.04),
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) =>
                    muiAlpha(theme, (p) => p.text.primary, 0.08),
                },
              }}
            >
              <PanelLeft size={18} aria-hidden />
            </IconButton>
          </Tooltip>
          <Typography
            component="h1"
            noWrap
            sx={{
              fontSize: "1.125rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            {title}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ flexShrink: 0, alignItems: "center" }}
        >
          <DashboardThemeToggle />
          <Stack
            direction="row"
            spacing={1}
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}
          >
            {companyLogoUrl ? (
              <Box
                sx={{
                  display: "flex",
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={companyLogoUrl}
                  alt={`${companyName} logo`}
                  width={32}
                  height={32}
                  style={{
                    width: 32,
                    height: "auto",
                    maxHeight: 32,
                    objectFit: "contain",
                  }}
                  unoptimized
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  width: 32,
                  height: 32,
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
                aria-hidden
              >
                {companyInitials(companyName)}
              </Box>
            )}
            <Typography
              noWrap
              sx={{
                maxWidth: 140,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "text.primary",
              }}
            >
              {companyName}
            </Typography>
          </Stack>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton
                  type="button"
                  aria-label="Account menu"
                  size="small"
                  sx={{
                    p: 0,
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Avatar>
                    <AvatarFallback>{userInitials(employeeName)}</AvatarFallback>
                  </Avatar>
                </IconButton>
              }
            />
            <DropdownMenuContent
              align="end"
              side="bottom"
              sideOffset={8}
              className={dashboardDropdownContentClass}
            >
              <div className={dashboardDropdownHeaderClass}>
                <p className={dashboardDropdownLabelClass}>{employeeName}</p>
                <p className={dashboardDropdownMetaClass}>{companyName}</p>
              </div>
              <DropdownMenuSeparator className="my-2 bg-[var(--eb-border)]" />
              <div className={dashboardDropdownMenuSectionClass}>
                <DropdownMenuItem
                  variant="destructive"
                  className={dashboardDropdownItemClass}
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
