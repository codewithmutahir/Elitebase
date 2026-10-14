"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

const SIDEBAR_EXPANDED_KEY = "sidebar-expanded";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_EXPANDED_KEY);
    if (stored === "false") setSidebarExpanded(false);
    if (stored === "true") setSidebarExpanded(true);
  }, []);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const setExpanded = useCallback((expanded: boolean) => {
    setSidebarExpanded(expanded);
    window.localStorage.setItem(
      SIDEBAR_EXPANDED_KEY,
      expanded ? "true" : "false"
    );
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      window.localStorage.setItem(
        SIDEBAR_EXPANDED_KEY,
        next ? "true" : "false"
      );
      return next;
    });
  }, []);

  return (
    <>
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
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={closeMobileNav}
        expanded={sidebarExpanded}
        onExpandedChange={setExpanded}
      />
      <Stack
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          minWidth: 0,
          flex: 1,
        }}
      >
        <Header
          onMenuClick={openMobileNav}
          sidebarExpanded={sidebarExpanded}
          onSidebarToggle={toggleSidebar}
        />
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
    </>
  );
}
