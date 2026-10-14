/** Shared portal product UI — always dark navy + gold (`.portal-shell`). */

/** Prefer MUI `text.*` / `background.*` — `--eb-*` follow `.dashboard-shell--light|dark`. */
export const portalPageTitleSx = {
  fontFamily: "var(--font-aeonik), var(--font-satoshi), sans-serif",
  fontSize: { xs: "1.5rem", sm: "1.75rem" },
  fontWeight: 560,
  letterSpacing: "-0.03em",
  color: "text.primary",
} as const;

export const portalPageSubtitleSx = {
  mt: 0.75,
  color: "text.secondary",
  fontSize: "0.9375rem",
  lineHeight: 1.5,
  maxWidth: 540,
} as const;

export const portalPanelSx = {
  borderRadius: "14px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
} as const;

export const portalSelectSx = {
  minWidth: { xs: "100%", sm: 200 },
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "background.paper",
    color: "text.primary",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "divider" },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 1,
      boxShadow:
        "0 0 0 2px color-mix(in srgb, var(--eb-gold-500) 25%, transparent)",
    },
  },
  "& .MuiSelect-icon": { color: "text.secondary" },
} as const;
