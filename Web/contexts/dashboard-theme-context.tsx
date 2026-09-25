"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

function readStoredTheme(): DashboardTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" ? "light" : "dark";
}

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setMounted(true);
  }, []);

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
      <div
        className={cn(
          "dashboard-shell relative grid min-h-screen grid-cols-[auto_1fr] bg-[var(--eb-ink)] text-[var(--eb-text)]",
          theme === "dark" ? "dashboard-shell--dark" : "dashboard-shell--light"
        )}
        data-dashboard-theme={mounted ? theme : "dark"}
      >
        {children}
      </div>
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
