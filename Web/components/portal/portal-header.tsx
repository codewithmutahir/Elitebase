"use client";

import { LogOut, Menu, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
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
import {
  dashboardDropdownContentClass,
  dashboardDropdownHeaderClass,
  dashboardDropdownItemClass,
  dashboardDropdownLabelClass,
  dashboardDropdownMenuSectionClass,
  dashboardDropdownMetaClass,
} from "@/lib/dashboard/styles";
import { getPortalPageTitle } from "@/lib/layout/page-titles";
import { authClient } from "@/lib/auth-client";

type PortalHeaderProps = {
  employeeName: string;
  companyName: string;
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

export function PortalHeader({
  employeeName,
  companyName,
  onMenuClick,
  sidebarExpanded,
  onSidebarToggle,
}: PortalHeaderProps) {
  const pathname = usePathname();
  const title = getPortalPageTitle(pathname);

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
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        zIndex: 30,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) =>
          muiAlpha(theme, (palette) => palette.background.paper, 0.8),
        backdropFilter: "blur(12px)",
        color: "text.primary",
      }}
    >
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
          <Typography
            noWrap
            sx={{
              display: { xs: "none", sm: "block" },
              maxWidth: 160,
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            {companyName}
          </Typography>

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
