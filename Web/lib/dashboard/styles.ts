/** Shared class strings for dashboard product UI (respects light/dark shell tokens). */
export const dashboardNativeSelectClass =
  "dashboard-native-select mt-1.5 flex h-10 w-full min-w-0 rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 py-2 text-sm text-[var(--eb-text)] shadow-none outline-none transition-[border-color,box-shadow] focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25";

export const dashboardPageIntroClass = "text-sm text-[var(--eb-muted)]";

export const dashboardSectionTitleClass =
  "text-lg font-medium tracking-tight text-[var(--eb-text)]";

export const dashboardFocusRingClass =
  "outline-none focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25";

/** Portaled menus (render outside `.dashboard-shell`) — pair with `.dashboard-dropdown` in globals.css */
export const dashboardDropdownContentClass =
  "dashboard-dropdown min-w-56 w-56 max-w-[min(100vw-2rem,16rem)] border border-[var(--eb-border)] bg-[var(--eb-surface)] p-2 text-[var(--eb-text)] shadow-lg ring-0";

export const dashboardDropdownHeaderClass =
  "mb-1 border-b border-[var(--eb-border)] px-1 pb-3 pt-0.5";

export const dashboardDropdownMenuSectionClass =
  "flex flex-col gap-1 px-0.5 py-1";

export const dashboardDropdownItemClass =
  "gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-[var(--eb-text)] focus:bg-[var(--eb-hover-overlay)] focus:text-[var(--eb-text)] data-[highlighted]:bg-[var(--eb-hover-overlay)] data-[highlighted]:text-[var(--eb-text)] [&_svg]:text-[var(--eb-muted)]";

export const dashboardDropdownLabelClass =
  "text-sm font-semibold leading-snug text-[var(--eb-text)]";

export const dashboardDropdownMetaClass =
  "mt-1 truncate text-xs leading-relaxed text-[var(--eb-muted)]";

/** Portaled side panels — pair with `.dashboard-sheet` rules in globals.css */
export const dashboardSheetContentClass =
  "dashboard-sheet border-[var(--eb-border)] bg-[var(--eb-surface)] text-[var(--eb-text)] shadow-[0_0_80px_rgba(0,0,0,0.5)]";

/** Portaled dialogs (timesheet edit, schedule, etc.) — pair with `.dashboard-dialog` in globals.css */
export const dashboardDialogContentClass =
  "dashboard-dialog ring-[var(--eb-border)] shadow-[0_0_80px_rgba(0,0,0,0.45)]";

/** Portaled popovers (availability hours, shift edit) — pair with `.dashboard-popover` in globals.css */
export const dashboardPopoverContentClass =
  "dashboard-popover ring-[var(--eb-border)] shadow-lg";

/** Solid primary actions in dashboard (portaled or in-shell — avoids root blue `primary`). */
export const dashboardPrimaryButtonClass =
  "border-transparent bg-[var(--eb-accent)] text-[#060a12] hover:bg-[var(--eb-accent-dark,#1FA89C)] focus-visible:ring-[var(--eb-accent)]/35";

/** Secondary / cancel in portaled dashboard UI (outline variant inherits root `--background` without these). */
export const dashboardOutlineButtonClass =
  "border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-text)] shadow-none hover:bg-[var(--eb-hover-overlay)] hover:text-[var(--eb-text)]";

export const dashboardGhostItemButtonClass =
  "justify-start font-normal text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)] hover:text-[var(--eb-text)]";

export const dashboardSheetOverlayClass =
  "dashboard-sheet-overlay bg-[var(--eb-ink)]/75 backdrop-blur-sm";

export const dashboardSheetSuccessPanelClass =
  "rounded-xl border border-[var(--eb-accent)]/25 bg-gradient-to-b from-[var(--eb-accent)]/10 via-[var(--eb-elevated)]/80 to-[var(--eb-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_var(--eb-accent-glow,rgba(46,196,182,0.12))]";

export const dashboardPinDisplayClass =
  "font-mono text-5xl font-bold tracking-[0.28em] text-[var(--eb-accent)] tabular-nums";

export const dashboardFieldInputClass =
  "rounded-[10px] border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 text-[var(--eb-text)] outline-none focus-visible:border-[var(--eb-accent)] focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]/25";
