import type { Theme } from "@mui/material/styles";

type CssVarsPalette = NonNullable<Theme["vars"]>["palette"];

/**
 * Scheme-safe alpha for cssVariables themes.
 * Prefer this over `alpha(theme.palette…)` which bakes the wrong scheme hex.
 */
export function muiAlpha(
  theme: Theme,
  getColor: (palette: CssVarsPalette | Theme["palette"]) => string,
  opacity: number
): string {
  const palette = theme.vars?.palette ?? theme.palette;
  return theme.alpha(getColor(palette), opacity);
}
