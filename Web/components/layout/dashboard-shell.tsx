"use client";

import { useCallback, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardThemeProvider } from "@/contexts/dashboard-theme-context";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <DashboardThemeProvider>
      <Box
        className="dashboard-main-glow"
        aria-hidden
        sx={{
          pointerEvents: "none",
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
      />
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
      <Stack
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          minWidth: 0,
          flex: 1,
        }}
      >
        <Header onMenuClick={openMobileNav} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 3, sm: 4 },
          }}
        >
          {children}
        </Box>
      </Stack>
      <Toaster position="top-right" richColors closeButton />
    </DashboardThemeProvider>
  );
}
