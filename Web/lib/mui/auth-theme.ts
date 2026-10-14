"use client";

import { createTheme } from "@mui/material/styles";
import { elitebaseMuiTheme } from "@/lib/mui/theme";

const AUTH_PRIMARY = {
  main: "#D9A63F",
  light: "#F7DE94",
  dark: "#B8801F",
  contrastText: "#070F24",
} as const;

/**
 * Auth / onboarding MUI — navy + gold; dashboard keeps `elitebaseMuiTheme`.
 *
 * Must be a fresh `createTheme({…})`, not `createTheme(dashboardTheme, overrides)`.
 * With `cssVariables`, only the first argument regenerates `--mui-palette-primary-*`.
 * Merging onto a pre-built cssVariables theme left stale primary channel tokens.
 */
export const elitebaseAuthMuiTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: '[data-dashboard-theme="%s"]',
  },
  defaultColorScheme: "dark",
  colorSchemes: {
    dark: {
      palette: {
        mode: "dark",
        primary: AUTH_PRIMARY,
        secondary: {
          main: "#14265A",
          dark: "#0B1633",
          contrastText: "#F5F7FB",
        },
        background: {
          default: "#0B1633",
          paper: "#14265A",
        },
        text: {
          primary: "#F5F7FB",
          secondary: "#A9B4CF",
        },
        divider: "rgba(255, 255, 255, 0.08)",
        action: {
          hover: "rgba(255, 255, 255, 0.06)",
          selected: "rgba(255, 255, 255, 0.06)",
          focus: "rgba(255, 255, 255, 0.08)",
          active: "rgba(217, 166, 63, 0.14)",
        },
        info: {
          main: "#2F4EA2",
        },
        success: {
          main: "rgb(52, 211, 153)",
        },
        warning: {
          main: "rgb(251, 191, 36)",
        },
        error: {
          main: "rgb(248, 113, 113)",
        },
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily:
      '"Aeonik", "Satoshi", var(--font-inter), "Inter", sans-serif',
  },
  components: elitebaseMuiTheme.components,
});
