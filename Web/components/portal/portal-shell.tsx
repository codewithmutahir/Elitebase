"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Toaster } from "@/components/ui/sonner";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalRouteSkeleton } from "@/components/portal/portal-route-skeleton";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalNavProvider, usePortalNav } from "@/contexts/portal-nav-context";

const SIDEBAR_EXPANDED_KEY = "portal-sidebar-expanded";

type PortalShellProps = {
  employeeName: string;
  companyName: string;
  companyLogoUrl: string | null;
  children: ReactNode;
};

function PortalShellFrame({
  employeeName,
  companyName,
  companyLogoUrl,
  children,
}: PortalShellProps) {
  const { pending } = usePortalNav();
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
          width: "100%",
          maxWidth: "100vw",
          overflow: "hidden",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "auto minmax(0, 1fr)",
          },
        }}
      >
        <PortalSidebar
          employeeName={employeeName}
          companyName={companyName}
          companyLogoUrl={companyLogoUrl}
          mobileOpen={mobileNavOpen}
          onMobileClose={closeMobileNav}
          expanded={sidebarExpanded}
        />
        <Stack
          sx={{
            minHeight: "100vh",
            minWidth: 0,
            maxWidth: "100%",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <PortalHeader
            employeeName={employeeName}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
            onMenuClick={openMobileNav}
            sidebarExpanded={sidebarExpanded}
            onSidebarToggle={toggleSidebar}
          />
          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: "100%",
              overflowX: "hidden",
              overflowY: "auto",
              p: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <Box
              sx={{ minWidth: 0, maxWidth: "100%", width: "100%" }}
              aria-busy={pending}
            >
              {pending ? <PortalRouteSkeleton /> : children}
            </Box>
          </Box>
        </Stack>
      </Box>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export function PortalShell(props: PortalShellProps) {
  return (
    <PortalNavProvider>
      <PortalShellFrame {...props} />
    </PortalNavProvider>
  );
}
