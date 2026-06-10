/** Elitebase design tokens — aligned with architecture.md (Homebase-style SaaS). */
export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

export const heading = {
  h1: "text-5xl font-bold tracking-tight text-slate-900",
  h2: "text-4xl font-bold tracking-tight text-slate-900",
  h3: "text-3xl font-semibold text-slate-900",
  h4: "text-2xl font-semibold text-slate-900",
  h5: "text-xl font-semibold text-slate-900",
  h6: "text-lg font-semibold text-slate-900",
} as const;

export const body = {
  base: "text-base text-slate-900",
  sm: "text-sm text-slate-600",
  muted: "text-sm text-slate-500",
} as const;
