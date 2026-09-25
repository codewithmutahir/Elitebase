/** Shared class strings for dashboard product UI (respects light/dark shell tokens). */
export const dashboardNativeSelectClass =
  "dashboard-native-select mt-1.5 flex h-10 w-full min-w-0 rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 py-2 text-sm text-[var(--eb-text)] shadow-none outline-none transition-[border-color,box-shadow] focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25";

export const dashboardCardClass =
  "border-[var(--eb-border)] bg-[var(--eb-surface)]/80 ring-[var(--eb-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

export const dashboardPageIntroClass = "text-sm text-[var(--eb-muted)]";

export const dashboardSectionTitleClass =
  "text-lg font-medium tracking-tight text-[var(--eb-text)]";

export const dashboardFileInputClass =
  "w-full rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 py-2 text-sm text-[var(--eb-text)] file:mr-4 file:rounded-md file:border file:file:border-[var(--eb-border)] file:bg-[var(--eb-surface)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--eb-accent)]";

export const dashboardAccentLinkClass =
  "font-semibold text-[var(--eb-accent)] transition-colors hover:text-[var(--eb-accent-dark,#1FA89C)]";

export const dashboardFocusRingClass =
  "outline-none focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25";

export const dashboardStickyTableCellClass =
  "sticky left-0 z-10 border-r border-[var(--eb-border)] bg-[var(--eb-surface)] px-4 py-3";

export const dashboardTableHeadRowClass =
  "border-b border-[var(--eb-border)] bg-[var(--eb-elevated)]/90";

export const dashboardFormPanelClass =
  "space-y-4 rounded-xl border border-[var(--eb-border)] bg-[var(--eb-surface)]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

/** Portaled menus (render outside `.dashboard-shell`) — pair with `.dashboard-dropdown` in globals.css */
export const dashboardDropdownContentClass =
  "dashboard-dropdown min-w-56 w-56 max-w-[min(100vw-2rem,16rem)] border border-[var(--eb-border)] bg-[var(--eb-surface)] p-1.5 text-[var(--eb-text)] shadow-lg ring-0";

export const dashboardDropdownItemClass =
  "gap-2 rounded-md px-2 py-2 text-[var(--eb-text)] focus:bg-[var(--eb-hover-overlay)] focus:text-[var(--eb-text)] data-[highlighted]:bg-[var(--eb-hover-overlay)] data-[highlighted]:text-[var(--eb-text)] [&_svg]:text-[var(--eb-muted)]";

export const dashboardDropdownLabelClass =
  "px-2 py-1.5 text-sm font-medium text-[var(--eb-text)]";

export const dashboardDropdownMetaClass =
  "truncate text-xs text-[var(--eb-muted)]";

/** Portaled side panels — pair with `.dashboard-sheet` in globals.css */
export const dashboardSheetContentClass =
  "shadow-[0_0_80px_rgba(0,0,0,0.5)]";

export const dashboardSheetOverlayClass =
  "dashboard-sheet-overlay bg-[var(--eb-ink)]/75 backdrop-blur-sm";

export const dashboardSheetSuccessPanelClass =
  "rounded-xl border border-[var(--eb-accent)]/25 bg-gradient-to-b from-[var(--eb-accent)]/10 via-[var(--eb-elevated)]/80 to-[var(--eb-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_var(--eb-accent-glow,rgba(46,196,182,0.12))]";

export const dashboardPinDisplayClass =
  "font-mono text-5xl font-bold tracking-[0.28em] text-[var(--eb-accent)] tabular-nums";

/** Employee profile pages (inside dashboard shell) */
export const profileCardClass = dashboardCardClass;

export const profileSectionTitleClass = dashboardSectionTitleClass;

export const profileFieldLabelClass =
  "text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted)]";

export const profileFieldLabelPlainClass = "text-sm text-[var(--eb-muted)]";

export const profileValueClass = "text-sm font-medium text-[var(--eb-text)]";

export const profileMutedClass = dashboardPageIntroClass;

export const profileLinkClass = dashboardAccentLinkClass;

export const profileContactLinkClass =
  "inline-flex items-center gap-1.5 font-medium text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-accent)]";

export const profileInputClass =
  "flex h-10 w-full rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 text-sm text-[var(--eb-text)] outline-none focus-visible:border-[var(--eb-accent)] focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]/25";

export const profileTextareaClass =
  "min-h-[80px] flex-1 rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 px-3 py-2 text-sm text-[var(--eb-text)] outline-none placeholder:text-[var(--eb-muted)] focus-visible:border-[var(--eb-accent)] focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]/25";

export const profileTableHeadClass =
  "border-b border-[var(--eb-border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted)]";

export const profileTableRowClass = "border-b border-[var(--eb-border)]";

export const profileDestructiveOutlineClass =
  "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300";

export const profileKioskBannerClass =
  "rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/60 p-3 text-sm text-[var(--eb-muted)]";

export const profileStatCardClass = "profile-stat-card";

export const profileNoteCardClass =
  "group rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/40 p-4";

export const profileEditPanelClass =
  "space-y-4 rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/50 p-4";

export const profileTimelineBorderClass = "border-l-2 border-[var(--eb-border)] pl-4";

export const profileTimelineDotClass =
  "absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-[var(--eb-accent)]";

export const profileTimelineDotMutedClass =
  "absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-[var(--eb-muted)]/45";

export const dashboardFieldInputClass =
  "rounded-[10px] border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 focus-visible:border-[var(--eb-accent)] focus-visible:ring-[var(--eb-accent)]/25";

export const dashboardMetricValueClass =
  "mt-1 text-2xl font-bold tracking-tight text-[var(--eb-text)]";

export const dashboardMetricLabelClass = "text-sm text-[var(--eb-muted)]";

export const dashboardHeadingClass =
  "text-lg font-medium tracking-tight text-[var(--eb-text)]";

export const dashboardSubheadingClass =
  "text-sm font-semibold text-[var(--eb-text)]";

/** Sticky schedule/availability grid — header row */
export const dashboardGridTheadClass =
  "sticky top-0 z-30 border-b border-[var(--eb-border)] bg-[var(--eb-elevated)]/95 shadow-[inset_0_-1px_0_var(--eb-border)]";

/** Sticky schedule/availability grid — footer totals row */
export const dashboardGridTfootClass =
  "sticky bottom-0 z-30 border-t border-[var(--eb-border)] bg-[var(--eb-elevated)]/95 shadow-[inset_0_1px_0_var(--eb-border)]";

/** Left label column in schedule grid (open shifts, employee name, totals) */
export const dashboardGridRowLabelCellClass =
  "sticky left-0 z-20 w-[220px] min-w-[220px] border-r border-[var(--eb-border)] bg-[var(--eb-surface)] px-4 py-3";

export const dashboardGridRowLabelCellMutedClass =
  "sticky left-0 z-20 w-[220px] min-w-[220px] border-r border-[var(--eb-border)] bg-[var(--eb-elevated)]/60 px-4 py-3";

export const dashboardGridCornerHeadClass =
  "sticky left-0 z-40 w-[220px] min-w-[220px] border-r border-[var(--eb-border)] bg-[var(--eb-elevated)]/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted)]";

export const dashboardGridDayHeadClass =
  "min-w-[110px] border-l border-[var(--eb-border)] px-2 py-3 text-center";

export const dashboardGridBodyCellClass =
  "min-w-[110px] border-l border-[var(--eb-border)] align-top p-0";

export const dashboardGridOffDayCellClass =
  "min-w-[110px] border-l border-[var(--eb-border)] bg-[var(--eb-elevated)]/40 align-top p-0";
