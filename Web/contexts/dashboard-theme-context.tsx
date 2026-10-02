"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Box from "@mui/material/Box";
import { useColorScheme } from "@mui/material/styles";
import { cn } from "@/lib/utils";

export type DashboardTheme = "light" | "dark";

const STORAGE_KEY = "elitebase-dashboard-theme";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
  mounted: boolean;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(
  null
);

/** Keeps MUI `palette.mode` aligned with shell tokens (`html[data-dashboard-theme]`). */
function MuiDashboardColorSchemeSync({ theme }: { theme: DashboardTheme }) {
  const { mode, setMode } = useColorScheme();

  useLayoutEffect(() => {
    if (mode !== theme) {
      setMode(theme);
    }
  }, [theme, mode, setMode]);

  return null;
}

function readStoredTheme(): DashboardTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

function subscribeClientMounted() {
  return () => {};
}

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>(() => readStoredTheme());
  const mounted = useSyncExternalStore(
    subscribeClientMounted,
    () => true,
    () => false
  );

  useLayoutEffect(() => {
    document.documentElement.dataset.dashboardTheme = theme;
  }, [theme]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.dashboardTheme;
    };
  }, []);

  const setTheme = useCallback((next: DashboardTheme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: DashboardTheme = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, mounted }),
    [theme, setTheme, toggleTheme, mounted]
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      <Box
        className={cn(
          "dashboard-shell",
          theme === "dark" ? "dashboard-shell--dark" : "dashboard-shell--light"
        )}
        data-dashboard-theme={mounted ? theme : "dark"}
        sx={{
          position: "relative",
          display: "grid",
          minHeight: "100vh",
          gridTemplateColumns: {
            xs: "1fr",
            md: "auto 1fr",
          },
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <MuiDashboardColorSchemeSync theme={theme} />
        {children}
      </Box>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}
