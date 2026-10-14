"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Toaster } from "@/components/ui/sonner";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

const SIDEBAR_EXPANDED_KEY = "portal-sidebar-expanded";

type PortalShellProps = {
  employeeName: string;
  companyName: string;
  children: ReactNode;
};

export function PortalShell({
  employeeName,
  companyName,
  children,
}: PortalShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_EXPANDED_KEY);
    if (stored === "false") setSidebarExpanded(false);
    if (stored === "true") setSidebarExpanded(true);
  }, []);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

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
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          minHeight: "100vh",
          gridTemplateColumns: {
            xs: "1fr",
            md: "auto 1fr",
          },
        }}
      >
        <PortalSidebar
          employeeName={employeeName}
          companyName={companyName}
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          expanded={sidebarExpanded}
        />
        <Stack
          sx={{
            minHeight: "100vh",
            minWidth: 0,
            flex: 1,
          }}
        >
          <PortalHeader
            employeeName={employeeName}
            companyName={companyName}
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
      </Box>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
