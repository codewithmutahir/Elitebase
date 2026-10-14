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
export type DashboardThemePreference = DashboardTheme | "system";

const STORAGE_KEY = "elitebase-dashboard-theme";

type DashboardThemeContextValue = {
  /** Resolved light/dark applied to the shell. */
  theme: DashboardTheme;
  /** Stored preference (may be system). */
  preference: DashboardThemePreference;
  setPreference: (preference: DashboardThemePreference) => void;
  /** Cycles light → dark → system. */
  cyclePreference: () => void;
  /** @deprecated Prefer setPreference / cyclePreference */
  setTheme: (theme: DashboardTheme) => void;
  /** @deprecated Prefer cyclePreference */
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

function readSystemTheme(): DashboardTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredPreference(): DashboardThemePreference {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  // First visit — light (product default); user can pick Dark or System.
  return "light";
}

function resolveTheme(preference: DashboardThemePreference): DashboardTheme {
  if (preference === "system") return readSystemTheme();
  return preference;
}

function subscribeClientMounted() {
  return () => {};
}

type DashboardThemeProviderProps = {
  children: ReactNode;
  /**
   * `dashboard` — employer grid shell (sidebar + main).
   * `fill` — full-height themed wrapper (employee portal builds its own chrome).
   */
  layout?: "dashboard" | "fill";
};

export function DashboardThemeProvider({
  children,
  layout = "dashboard",
}: DashboardThemeProviderProps) {
  const [preference, setPreferenceState] = useState<DashboardThemePreference>(
    () => readStoredPreference()
  );
  const [theme, setThemeState] = useState<DashboardTheme>(() =>
    resolveTheme(readStoredPreference())
  );
  const mounted = useSyncExternalStore(
    subscribeClientMounted,
    () => true,
    () => false
  );

  useLayoutEffect(() => {
    setThemeState(resolveTheme(preference));
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemeState(readSystemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  useLayoutEffect(() => {
    document.documentElement.dataset.dashboardTheme = theme;
  }, [theme]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.dashboardTheme;
    };
  }, []);

  const setPreference = useCallback((next: DashboardThemePreference) => {
    setPreferenceState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(resolveTheme(next));
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState((current) => {
      const order: DashboardThemePreference[] = ["light", "dark", "system"];
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length] ?? "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      setThemeState(resolveTheme(next));
      return next;
    });
  }, []);

  const setTheme = useCallback(
    (next: DashboardTheme) => {
      setPreference(next);
    },
    [setPreference]
  );

  const toggleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const resolved = resolveTheme(current);
      const next: DashboardTheme = resolved === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      setThemeState(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      cyclePreference,
      setTheme,
      toggleTheme,
      mounted,
    }),
    [
      theme,
      preference,
      setPreference,
      cyclePreference,
      setTheme,
      toggleTheme,
      mounted,
    ]
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      <Box
        className={cn(
          "dashboard-shell",
          theme === "dark" ? "dashboard-shell--dark" : "dashboard-shell--light"
        )}
        data-dashboard-theme={mounted ? theme : "light"}
        sx={
          layout === "dashboard"
            ? {
                position: "relative",
                display: "grid",
                minHeight: "100vh",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "auto 1fr",
                },
                bgcolor: "background.default",
                color: "text.primary",
              }
            : {
                position: "relative",
                display: "block",
                minHeight: "100vh",
                bgcolor: "background.default",
                color: "text.primary",
              }
        }
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
