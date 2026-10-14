import type { SxProps, Theme } from "@mui/material/styles";
import { muiAlpha } from "@/lib/mui/alpha";

/** Shared sx constants for dashboard product UI (replaces Tailwind class strings). */

export const dashboardPageIntroSx: SxProps<Theme> = {
  fontSize: "0.875rem",
  color: "text.secondary",
};

export const dashboardSectionTitleSx: SxProps<Theme> = {
  fontSize: "1.125rem",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "text.primary",
};

export const dashboardHeadingSx: SxProps<Theme> = {
  fontSize: "1.125rem",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "text.primary",
};

export const dashboardSubheadingSx: SxProps<Theme> = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "text.primary",
};

export const dashboardCardSx: SxProps<Theme> = {
  borderColor: "divider",
  bgcolor: "background.paper",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

/** Pill text link / chip-style CTA on dashboard headers (View roster, etc.). */
export const dashboardPillLinkSx: SxProps<Theme> = {
  borderRadius: 999,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: (theme) => muiAlpha(theme, (p) => p.text.primary, 0.04),
  px: 2,
  py: 1,
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "text.primary",
  textDecoration: "none",
  transition:
    "border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease",
  "&:hover": {
    borderColor: (theme) => muiAlpha(theme, (p) => p.primary.main, 0.45),
    bgcolor: (theme) => muiAlpha(theme, (p) => p.primary.main, 0.1),
    color: "primary.main",
  },
  "&:active": {
    bgcolor: (theme) => muiAlpha(theme, (p) => p.primary.main, 0.16),
    borderColor: (theme) => muiAlpha(theme, (p) => p.primary.main, 0.55),
  },
};

/** Kiosk setup code reveal — dark elevated surface + gold glow (css-var-safe). */
export const dashboardSetupCodePanelSx: SxProps<Theme> = {
  borderRadius: "12px",
  border: "1px solid",
  borderColor: (theme) => muiAlpha(theme, (p) => p.primary.main, 0.28),
  bgcolor: "secondary.main",
  backgroundImage: (theme) =>
    `linear-gradient(135deg, ${muiAlpha(theme, (p) => p.primary.main, 0.14)} 0%, transparent 48%), radial-gradient(ellipse 90% 70% at 50% -10%, ${muiAlpha(theme, (p) => p.primary.main, 0.12)}, transparent 65%)`,
  p: 4,
  textAlign: "center",
  boxShadow: (theme) =>
    `inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 40px ${muiAlpha(theme, (p) => p.primary.main, 0.12)}`,
};

export const dashboardSetupCodeValueSx: SxProps<Theme> = {
  mt: 2,
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: { xs: "3rem", sm: "3.75rem" },
  fontWeight: 700,
  letterSpacing: "0.08em",
  fontVariantNumeric: "tabular-nums",
  color: "primary.main",
};

export const dashboardFormPanelSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderRadius: "12px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  p: 2,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
};

export const dashboardNativeSelectSx: SxProps<Theme> = {
  mt: 1.5,
  display: "flex",
  height: 40,
  width: "100%",
  minWidth: 0,
  borderRadius: "10px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "secondary.main",
  px: 1.5,
  py: 1,
  fontSize: "0.875rem",
  color: "text.primary",
  outline: "none",
  boxShadow: "none",
  "&:focus": {
    borderColor: "primary.main",
    boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}40`,
  },
};

export const dashboardNativeSelectCompactSx: SxProps<Theme> = [
  dashboardNativeSelectSx,
  { mt: 0 },
];

export const dashboardFileInputSx: SxProps<Theme> = {
  width: "100%",
  borderRadius: "10px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "secondary.main",
  px: 1.5,
  py: 1,
  fontSize: "0.875rem",
  color: "text.primary",
  "&::file-selector-button": {
    mr: 2,
    borderRadius: "6px",
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    px: 1.5,
    py: 1,
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "primary.main",
    cursor: "pointer",
  },
};

export const dashboardAccentLinkSx: SxProps<Theme> = {
  fontWeight: 600,
  color: "primary.main",
  textDecoration: "none",
  transition: "color 0.15s ease",
  "&:hover": {
    color: "primary.dark",
  },
};

/** Missing/blocking field prompts (Add email, Add phone) — status red, not brand gold. */
export const dashboardErrorLinkSx: SxProps<Theme> = {
  fontWeight: 600,
  color: "error.main",
  textDecoration: "none",
  transition: "color 0.15s ease",
  "&:hover": {
    color: "error.dark",
    textDecoration: "underline",
  },
};

/** Optional incomplete fields (Add role, Add wage) — quiet, not accent. */
export const dashboardMutedLinkSx: SxProps<Theme> = {
  fontWeight: 600,
  color: "text.secondary",
  textDecoration: "none",
  transition: "color 0.15s ease",
  "&:hover": {
    color: "text.primary",
    textDecoration: "underline",
  },
};

export const dashboardMetricLabelSx: SxProps<Theme> = {
  fontSize: "0.875rem",
  color: "text.secondary",
};

export const dashboardMetricValueSx: SxProps<Theme> = {
  mt: 0.5,
  fontSize: "1.5rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "text.primary",
};

export const dashboardAlertErrorSx: SxProps<Theme> = {
  borderRadius: "10px",
  border: "1px solid",
  px: 2,
  py: 1.5,
  fontSize: "0.875rem",
  borderColor: (theme) => `${theme.palette.error.main}4D`,
  backgroundColor: (theme) => `${theme.palette.error.main}1A`,
  color: "error.main",
};

export const dashboardAlertSuccessSx: SxProps<Theme> = {
  borderRadius: "10px",
  border: "1px solid",
  px: 2,
  py: 1.5,
  fontSize: "0.875rem",
  borderColor: (theme) => `${theme.palette.success.main}4D`,
  backgroundColor: (theme) => `${theme.palette.success.main}1A`,
  color: "success.main",
};

/** Sticky schedule/availability grid — header row */
export const dashboardGridTheadSx: SxProps<Theme> = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  borderBottom: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 95%, transparent)",
  boxShadow: "inset 0 -1px 0 var(--eb-border)",
};

/** Sticky schedule/availability grid — footer totals row */
export const dashboardGridTfootSx: SxProps<Theme> = {
  position: "sticky",
  bottom: 0,
  zIndex: 30,
  borderTop: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 95%, transparent)",
  boxShadow: "inset 0 1px 0 var(--eb-border)",
};

export const dashboardGridRowLabelCellSx: SxProps<Theme> = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  width: 220,
  minWidth: 220,
  borderRight: "1px solid var(--eb-border)",
  backgroundColor: "var(--eb-surface)",
  px: 2,
  py: 1.5,
};

export const dashboardGridRowLabelCellMutedSx: SxProps<Theme> = {
  position: "sticky",
  left: 0,
  zIndex: 20,
  width: 220,
  minWidth: 220,
  borderRight: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 60%, transparent)",
  px: 2,
  py: 1.5,
};

export const dashboardGridCornerHeadSx: SxProps<Theme> = {
  position: "sticky",
  left: 0,
  zIndex: 40,
  width: 220,
  minWidth: 220,
  borderRight: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 95%, transparent)",
  px: 2,
  py: 1.5,
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--eb-muted)",
};

export const dashboardGridDayHeadSx: SxProps<Theme> = {
  minWidth: 110,
  borderLeft: "1px solid var(--eb-border)",
  px: 1,
  py: 1.5,
  textAlign: "center",
};

export const dashboardGridBodyCellSx: SxProps<Theme> = {
  minWidth: 110,
  borderLeft: "1px solid var(--eb-border)",
  verticalAlign: "top",
  p: 0,
};

export const dashboardGridOffDayCellSx: SxProps<Theme> = {
  minWidth: 110,
  borderLeft: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 40%, transparent)",
  verticalAlign: "top",
  p: 0,
};

export const dashboardStickyTableCellSx: SxProps<Theme> = {
  position: "sticky",
  left: 0,
  zIndex: 10,
  borderRight: "1px solid var(--eb-border)",
  backgroundColor: "var(--eb-surface)",
  px: 2,
  py: 1.5,
};

/** Employee profile shared sx */
export const profileFieldLabelSx: SxProps<Theme> = {
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "text.secondary",
};

export const profileFieldLabelPlainSx: SxProps<Theme> = {
  fontSize: "0.875rem",
  color: "text.secondary",
};

export const profileValueSx: SxProps<Theme> = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "text.primary",
};

export const profileContactLinkSx: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.75,
  fontWeight: 500,
  color: "text.secondary",
  textDecoration: "none",
  transition: "color 0.15s ease",
  "&:hover": {
    color: "primary.main",
  },
};

export const profileDestructiveOutlineSx: SxProps<Theme> = {
  flexShrink: 0,
  whiteSpace: "nowrap",
  borderColor: (theme) => `${theme.palette.error.main}59`,
  "&:hover": {
    bgcolor: (theme) => `${theme.palette.error.main}1A`,
    borderColor: "error.main",
  },
};

export const profileNoteCardSx: SxProps<Theme> = {
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 40%, var(--eb-surface))",
  p: 2,
};

export const profileEditPanelSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 55%, var(--eb-surface))",
  p: 2.5,
};

export const profileKioskBannerSx: SxProps<Theme> = {
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 60%, var(--eb-surface))",
  p: 1.5,
  fontSize: "0.875rem",
  color: "var(--eb-muted)",
};

/** Job-history timeline: flex rail + content (see job-details-tab). */
export const profileTimelineListSx: SxProps<Theme> = {
  position: "relative",
  listStyle: "none",
  m: 0,
  p: 0,
};

export const profileTimelineRailSx: SxProps<Theme> = {
  position: "absolute",
  left: 8,
  top: 10,
  bottom: 10,
  width: 2,
  borderRadius: 1,
  bgcolor: "divider",
  pointerEvents: "none",
};

export const profileTimelineRowSx: SxProps<Theme> = {
  display: "flex",
  alignItems: "flex-start",
  gap: 1.5,
};

export const profileTimelineMarkerColSx: SxProps<Theme> = {
  width: 18,
  flexShrink: 0,
  display: "flex",
  justifyContent: "center",
  pt: 0.375,
  zIndex: 1,
};

export const profileTimelineDotSx: SxProps<Theme> = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  flexShrink: 0,
  bgcolor: "primary.main",
  boxShadow: (theme) =>
    `0 0 0 2px ${(theme.vars?.palette ?? theme.palette).background.paper}`,
};

export const profileTimelineDotMutedSx: SxProps<Theme> = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  flexShrink: 0,
  bgcolor: (theme) => `${theme.palette.text.secondary}73`,
  boxShadow: (theme) =>
    `0 0 0 2px ${(theme.vars?.palette ?? theme.palette).background.paper}`,
};

export const profileTimelineContentSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  pt: 0.125,
};

export const profileTableHeadSx: SxProps<Theme> = {
  borderBottom: "1px solid",
  borderColor: "divider",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "text.secondary",
};

export const profileTableRowSx: SxProps<Theme> = {
  borderBottom: "1px solid",
  borderColor: "divider",
};

export const profileInputSx: SxProps<Theme> = {
  display: "flex",
  height: 40,
  width: "100%",
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 70%, transparent)",
  px: 1.5,
  fontSize: "0.875rem",
  color: "var(--eb-text)",
  outline: "none",
  "&:focus-visible": {
    borderColor: "var(--eb-accent)",
    boxShadow: "0 0 0 2px color-mix(in srgb, var(--eb-accent) 25%, transparent)",
  },
};

export const profileTextareaSx: SxProps<Theme> = {
  minHeight: 80,
  flex: 1,
  width: "100%",
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 70%, transparent)",
  px: 1.5,
  py: 1,
  fontSize: "0.875rem",
  color: "var(--eb-text)",
  outline: "none",
  resize: "vertical",
  "&::placeholder": {
    color: "var(--eb-muted)",
  },
  "&:focus-visible": {
    borderColor: "var(--eb-accent)",
    boxShadow: "0 0 0 2px color-mix(in srgb, var(--eb-accent) 25%, transparent)",
  },
};

export const profileStatCardSx: SxProps<Theme> = {
  borderRadius: "10px",
  border: "1px solid var(--eb-border)",
  bgcolor: "color-mix(in srgb, var(--eb-elevated) 88%, var(--eb-surface))",
  p: 2,
  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
};

export const profileStatLabelSx: SxProps<Theme> = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "text.secondary",
};

export const profileStatValueSx: SxProps<Theme> = {
  mt: 0.5,
  fontSize: "1.5rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "text.primary",
};
