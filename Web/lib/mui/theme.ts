"use client";

import { createTheme, type Theme } from "@mui/material/styles";
import { muiAlpha } from "@/lib/mui/alpha";
import type {} from "@mui/x-data-grid/themeAugmentation";

/** Table header row — same plane as card surface, not a separate gray band. */
function dashboardTableHeaderBg(theme: Theme) {
  return (theme.vars?.palette ?? theme.palette).background.paper;
}

/**
 * Elitebase MUI theme — mapped from `--eb-*` tokens in globals.css.
 * Ignores legacy `--elite-*` tokens.
 *
 * Prefer `theme.alpha((theme.vars?.palette ?? theme.palette)…)` in overrides — bare
 * `alpha(theme.palette…)` bakes the wrong scheme with cssVariables.
 */
export const elitebaseMuiTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: '[data-dashboard-theme="%s"]',
  },
  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: "#2EC4B6",
          dark: "#1FA89C",
          contrastText: "#060A12",
        },
        secondary: {
          main: "#E2E8F0",
          dark: "#CBD5E1",
          contrastText: "#0F172A",
        },
        background: {
          default: "#EEF1F6",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
        },
        divider: "rgba(15, 23, 42, 0.1)",
        action: {
          hover: "rgba(15, 23, 42, 0.05)",
          selected: "rgba(15, 23, 42, 0.05)",
          focus: "rgba(15, 23, 42, 0.08)",
          active: "rgba(46, 196, 182, 0.12)",
        },
        info: {
          main: "rgb(37, 99, 235)",
        },
        success: {
          main: "rgb(5, 150, 105)",
        },
        warning: {
          main: "rgb(180, 83, 9)",
        },
        error: {
          main: "rgb(220, 38, 38)",
        },
        DataGrid: {
          bg: "#FFFFFF",
          pinnedBg: "#F8FAFC",
          headerBg: "#F1F5F9",
        },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: "#2EC4B6",
          dark: "#1FA89C",
          contrastText: "#060A12",
        },
        secondary: {
          main: "#151D2E",
          dark: "#1A2438",
          contrastText: "#ECEEF2",
        },
        background: {
          default: "#060A12",
          paper: "#0E1524",
        },
        text: {
          primary: "#ECEEF2",
          secondary: "#8B93A7",
        },
        divider: "rgba(255, 255, 255, 0.08)",
        action: {
          hover: "rgba(255, 255, 255, 0.06)",
          selected: "rgba(255, 255, 255, 0.06)",
          focus: "rgba(255, 255, 255, 0.08)",
          active: "rgba(46, 196, 182, 0.14)",
        },
        info: {
          main: "#2EC4B6",
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
        DataGrid: {
          bg: "#0E1524",
          pinnedBg: "#0E1524",
          headerBg: "#0E1524",
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
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          variants: [
            {
              props: { variant: "ghost" },
              style: ({ theme }) => ({
                backgroundColor: "transparent",
                color: (theme.vars?.palette ?? theme.palette).text.primary,
                "&:hover": {
                  backgroundColor: muiAlpha(theme, (p) => p.text.primary, 0.06),
                },
              }),
            },
            {
              props: { variant: "link" },
              style: ({ theme }) => ({
                backgroundColor: "transparent",
                color: (theme.vars?.palette ?? theme.palette).primary.main,
                padding: 0,
                minWidth: 0,
                textDecoration: "none",
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                },
              }),
            },
            {
              props: { size: "xs" },
              style: {
                height: 24,
                minHeight: 24,
                paddingInline: 8,
                fontSize: "0.75rem",
                borderRadius: 6,
              },
            },
            {
              props: { size: "icon" },
              style: {
                width: 40,
                height: 40,
                minWidth: 40,
                padding: 0,
              },
            },
            {
              props: { size: "icon-xs" },
              style: {
                width: 24,
                height: 24,
                minWidth: 24,
                padding: 0,
                borderRadius: 6,
              },
            },
            {
              props: { size: "icon-sm" },
              style: {
                width: 32,
                height: 32,
                minWidth: 32,
                padding: 0,
                borderRadius: 8,
              },
            },
            {
              props: { size: "icon-lg" },
              style: {
                width: 44,
                height: 44,
                minWidth: 44,
                padding: 0,
              },
            },
            {
              props: { size: "medium" },
              style: {
                height: 40,
                minHeight: 40,
                paddingInline: 16,
              },
            },
            {
              props: { size: "small" },
              style: {
                height: 36,
                minHeight: 36,
                paddingInline: 12,
              },
            },
            {
              props: { size: "large" },
              style: {
                height: 44,
                minHeight: 44,
                paddingInline: 20,
                fontSize: "1rem",
              },
            },
          ],
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          minHeight: 40,
          "& input:focus-visible": {
            outline: "none",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: (theme.vars?.palette ?? theme.palette).primary.main,
            borderWidth: 1,
            boxShadow: `0 0 0 2px ${muiAlpha(theme, (p) => p.primary.main, 0.25)}`,
          },
        }),
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          minHeight: 40,
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: "small",
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: "0.875rem",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: "0.875rem",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: "none",
          backgroundColor: (theme.vars?.palette ?? theme.palette).background
            .paper,
          borderColor: (theme.vars?.palette ?? theme.palette).divider,
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
          paddingBlock: 16,
          '&[data-size="sm"]': {
            gap: 12,
            paddingBlock: 12,
          },
        }),
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingInline: 16,
          paddingTop: 0,
          paddingBottom: 0,
        },
        title: {
          fontSize: "1rem",
          fontWeight: 500,
          lineHeight: 1.375,
        },
        subheader: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          paddingInline: 16,
          paddingTop: 0,
          paddingBottom: 0,
          "&:last-child": {
            paddingBottom: 0,
          },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: 16,
          borderTop: "1px solid",
          borderColor: "divider",
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          fontWeight: 600,
          variants: [
            {
              props: { variant: "soft", color: "success" },
              style: ({ theme }) => ({
                backgroundColor: muiAlpha(theme, (p) => p.success.main, 0.1),
                border: `1px solid ${muiAlpha(theme, (p) => p.success.main, 0.35)}`,
                color: (theme.vars?.palette ?? theme.palette).success.main,
              }),
            },
            {
              props: { variant: "soft", color: "warning" },
              style: ({ theme }) => ({
                backgroundColor: muiAlpha(theme, (p) => p.warning.main, 0.1),
                border: `1px solid ${muiAlpha(theme, (p) => p.warning.main, 0.35)}`,
                color: (theme.vars?.palette ?? theme.palette).warning.main,
              }),
            },
            {
              props: { variant: "soft", color: "error" },
              style: ({ theme }) => ({
                backgroundColor: muiAlpha(theme, (p) => p.error.main, 0.1),
                border: `1px solid ${muiAlpha(theme, (p) => p.error.main, 0.35)}`,
                color: (theme.vars?.palette ?? theme.palette).error.main,
              }),
            },
            {
              props: { variant: "soft", color: "info" },
              style: ({ theme }) => ({
                backgroundColor: muiAlpha(theme, (p) => p.info.main, 0.1),
                border: `1px solid ${muiAlpha(theme, (p) => p.info.main, 0.35)}`,
                color: (theme.vars?.palette ?? theme.palette).info.main,
              }),
            },
            {
              props: { variant: "soft", color: "default" },
              style: ({ theme }) => ({
                backgroundColor: muiAlpha(theme, (p) => p.text.primary, 0.06),
                border: `1px solid ${(theme.vars?.palette ?? theme.palette).divider}`,
                color: (theme.vars?.palette ?? theme.palette).text.secondary,
              }),
            },
          ],
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 32,
          height: 32,
          fontSize: "0.875rem",
          position: "relative",
          '&[data-size="sm"]': {
            width: 24,
            height: 24,
            fontSize: "0.75rem",
          },
          '&[data-size="lg"]': {
            width: 40,
            height: 40,
          },
        },
      },
    },
    MuiListItemButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ theme }) => {
          const palette = theme.vars?.palette ?? theme.palette;
          const selectedBg = muiAlpha(theme, (p) => p.primary.main, 0.1);
          const activeBg = palette.action.active;
          const hoverBg = palette.action.hover;
          return {
            "&:hover": {
              backgroundColor: hoverBg,
            },
            "&:active": {
              backgroundColor: activeBg,
            },
            "&.Mui-selected": {
              backgroundColor: selectedBg,
              "&:hover": {
                backgroundColor: selectedBg,
              },
              "&:active": {
                backgroundColor: muiAlpha(theme, (p) => p.primary.main, 0.16),
              },
            },
          };
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "divider",
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 0,
      },
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          padding: "6px 12px",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 4,
          borderRadius: 999,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          minWidth: 640,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => {
          const palette = theme.vars?.palette ?? theme.palette;
          const headerBg = dashboardTableHeaderBg(theme);
          return {
            backgroundColor: headerBg,
            "& .MuiTableCell-head": {
              backgroundColor: headerBg,
              color: palette.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              borderBottomColor: palette.divider,
            },
          };
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiTableRow-root:hover": {
            backgroundColor: muiAlpha(theme, (p) => p.text.primary, 0.04),
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: (theme.vars?.palette ?? theme.palette).divider,
          color: (theme.vars?.palette ?? theme.palette).text.primary,
          fontSize: "0.875rem",
          paddingInline: 24,
          paddingBlock: 16,
        }),
        head: ({ theme }) => ({
          paddingBlock: 12,
          backgroundColor: dashboardTableHeaderBg(theme),
          color: (theme.vars?.palette ?? theme.palette).text.secondary,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 120ms ease",
        },
      },
    },
    MuiDataGrid: {
      defaultProps: {
        disableRowSelectionOnClick: true,
        pageSizeOptions: [10, 25, 50, 100],
      },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${(theme.vars?.palette ?? theme.palette).divider}`,
          borderRadius: 12,
          "--DataGrid-rowBorderColor": (theme.vars?.palette ?? theme.palette).divider,
          fontFamily: theme.typography.fontFamily,
          "& .MuiDataGrid-columnHeader": {
            color: (theme.vars?.palette ?? theme.palette).text.secondary,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          },
          "& .MuiDataGrid-cell": {
            borderColor: (theme.vars?.palette ?? theme.palette).divider,
            color: (theme.vars?.palette ?? theme.palette).text.primary,
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTopColor: (theme.vars?.palette ?? theme.palette).divider,
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: muiAlpha(theme, (p) => p.text.primary, 0.04),
          },
          "& .MuiTablePagination-root": {
            color: (theme.vars?.palette ?? theme.palette).text.secondary,
          },
        }),
      },
    },
  },
});
