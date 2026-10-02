"use client";

import { LogOut, Menu, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
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
import { useCompany } from "@/contexts/company-context";
import { authClient } from "@/lib/auth-client";
import { DashboardThemeToggle } from "@/components/layout/dashboard-theme-toggle";
import {
  dashboardDropdownContentClass,
  dashboardDropdownHeaderClass,
  dashboardDropdownItemClass,
  dashboardDropdownLabelClass,
  dashboardDropdownMenuSectionClass,
  dashboardDropdownMetaClass,
} from "@/lib/dashboard/styles";
import { getPageTitle } from "@/lib/layout/page-titles";

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

type HeaderProps = {
  onMenuClick?: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
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
            {company.logo_url ? (
              <Box sx={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
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
              >
                {companyInitials(company.name)}
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
              {company.name}
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
                    <AvatarFallback>{initials}</AvatarFallback>
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
                <p className={dashboardDropdownLabelClass}>
                  {user.name || "Account"}
                </p>
                <p className={dashboardDropdownMetaClass}>{user.email}</p>
              </div>
              <div className={dashboardDropdownMenuSectionClass}>
                <DropdownMenuItem
                  className={dashboardDropdownItemClass}
                  render={
                    <Link
                      href="/settings"
                      className="flex w-full items-center gap-2.5"
                    />
                  }
                >
                  <User className="size-4 shrink-0" aria-hidden />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={dashboardDropdownItemClass}
                  render={
                    <Link
                      href="/settings"
                      className="flex w-full items-center gap-2.5"
                    />
                  }
                >
                  <Settings className="size-4 shrink-0" aria-hidden />
                  Settings
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="my-2 bg-[var(--eb-border)]" />
              <div className="px-0.5 pb-0.5">
                <DropdownMenuItem
                  variant="destructive"
                  className={dashboardDropdownItemClass}
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  Logout
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
