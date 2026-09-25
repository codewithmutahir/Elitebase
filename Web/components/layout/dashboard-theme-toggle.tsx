"use client";

import { Moon, Sun } from "lucide-react";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { cn } from "@/lib/utils";

export function DashboardThemeToggle() {
  const { theme, toggleTheme, mounted } = useDashboardTheme();

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-[var(--eb-border)] transition-colors",
        "bg-[var(--eb-elevated)]/80 text-[var(--eb-muted)]",
        "hover:border-[var(--eb-accent)]/35 hover:text-[var(--eb-accent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)]/40",
        !mounted && "opacity-70"
      )}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
