"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import {
  ThemeProvider,
  useColorScheme,
  type SupportedColorScheme,
} from "@mui/material/styles";
import { useEffect, type ReactNode } from "react";
import { elitebaseMuiTheme } from "@/lib/mui/theme";

/** Same key as DashboardThemeProvider — do not diverge. */
const DASHBOARD_THEME_STORAGE_KEY = "elitebase-dashboard-theme";

type MuiProviderProps = {
  children: ReactNode;
  /** Auth routes stay dark; dashboard syncs via data-dashboard-theme. */
  defaultMode?: SupportedColorScheme;
  /**
   * Dashboard: share localStorage with DashboardThemeProvider.
   * Auth: false so a prior light dashboard choice does not lighten auth shells.
   */
  persistMode?: boolean;
};

/**
 * Auth routes: force a fixed scheme on `html` + MUI.
 *
 * Dashboard routes: `DashboardThemeProvider` + `MuiDashboardColorSchemeSync`
 * push theme → `setMode` and `html[data-dashboard-theme]`. Do not observe that
 * attribute here — MUI can briefly clear it during `setMode`, which previously
 * made this bridge fall back to `defaultMode` ("dark") and fight the provider.
 */
function MuiColorSchemeBridge({
  fallbackMode,
  lockMode,
}: {
  fallbackMode: SupportedColorScheme;
  lockMode: boolean;
}) {
  const { setMode } = useColorScheme();

  useEffect(() => {
    if (!lockMode) return;

    document.documentElement.setAttribute(
      "data-dashboard-theme",
      fallbackMode
    );
    setMode(fallbackMode);
  }, [fallbackMode, lockMode, setMode]);

  return null;
}

export function MuiProvider({
  children,
  defaultMode = "dark",
  persistMode = true,
}: MuiProviderProps) {
  const lockMode = !persistMode;

  useEffect(() => {
    if (lockMode) {
      document.documentElement.setAttribute("data-dashboard-theme", defaultMode);
    }
  }, [defaultMode, lockMode]);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider
        theme={elitebaseMuiTheme}
        defaultMode={defaultMode}
        modeStorageKey={
          persistMode ? DASHBOARD_THEME_STORAGE_KEY : undefined
        }
        storageManager={persistMode ? undefined : null}
        disableTransitionOnChange
      >
        <CssBaseline enableColorScheme />
        <MuiColorSchemeBridge
          fallbackMode={defaultMode}
          lockMode={lockMode}
        />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
