"use client";

import {
  CalendarDays,
  Clock3,
  FileText,
  HeartPulse,
  Home,
  LogOut,
  Plane,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
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
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { muiAlpha } from "@/lib/mui/alpha";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
} from "@/components/layout/sidebar";

const NAV: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] =
  [
    { href: "/portal", label: "Home", icon: Home, exact: true },
    { href: "/portal/clock", label: "Clock", icon: Clock3 },
    { href: "/portal/attendance", label: "Attendance", icon: CalendarDays },
    { href: "/portal/pay", label: "Pay", icon: Wallet },
    { href: "/portal/payslips", label: "Payslips", icon: FileText },
    { href: "/portal/benefits", label: "Benefits", icon: HeartPulse },
    { href: "/portal/leave", label: "Leave", icon: Plane },
  ];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "E"
  );
}

type PortalSidebarProps = {
  employeeName: string;
  companyName: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
  expanded: boolean;
};

export function PortalSidebar({
  employeeName,
  companyName,
  mobileOpen,
  onMobileClose,
  expanded,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const width = expanded ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_COLLAPSED;

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  }

  const nav = (
    <Stack sx={{ height: "100%", py: 2 }}>
      <Box sx={{ px: expanded ? 2.5 : 1.25, mb: 2 }}>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: "center", justifyContent: expanded ? "flex-start" : "center" }}
        >
          <Avatar sx={{ width: 36, height: 36 }}>
            <AvatarFallback>{initials(companyName)}</AvatarFallback>
          </Avatar>
          {expanded ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ fontSize: "0.875rem", fontWeight: 600, color: "text.primary" }}
              >
                {companyName}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: "0.75rem", color: "text.secondary" }}
              >
                Employee portal
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>

      <List dense sx={{ px: expanded ? 1.25 : 0.75, flex: 1 }}>
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const button = (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onMobileClose}
              selected={active}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: expanded ? "flex-start" : "center",
                px: expanded ? 1.5 : 1,
                "&.Mui-selected": {
                  bgcolor: (t) => muiAlpha(t, (p) => p.primary.main, 0.14),
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: (t) => muiAlpha(t, (p) => p.primary.main, 0.2),
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: expanded ? 36 : 0,
                  color: "inherit",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} aria-hidden />
              </ListItemIcon>
              {expanded ? <ListItemText primary={item.label} /> : null}
            </ListItemButton>
          );

          return expanded ? (
            button
          ) : (
            <Tooltip key={item.href} title={item.label} placement="right">
              {button}
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ mx: 1.5, my: 1 }} />

      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: expanded ? 2 : 1,
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "center",
        }}
      >
        {expanded ? (
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
              {employeeName}
            </Typography>
          </Box>
        ) : null}
        <Tooltip title="Sign out">
          <IconButton
            size="small"
            aria-label="Sign out"
            onClick={handleSignOut}
            sx={{ color: "text.secondary" }}
          >
            <LogOut size={16} aria-hidden />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  if (!isMdUp) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            bgcolor: "background.paper",
            backgroundImage: "none",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {nav}
      </Drawer>
    );
  }

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "block" },
        width,
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: (t) =>
          t.transitions.create("width", {
            duration: t.transitions.duration.shorter,
          }),
      }}
    >
      <Box sx={{ position: "sticky", top: 0, height: "100vh" }}>{nav}</Box>
    </Box>
  );
}
