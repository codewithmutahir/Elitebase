"use client";

import { Moon, Sun } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";

export function DashboardThemeToggle() {
  const { theme, toggleTheme, mounted } = useDashboardTheme();

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <IconButton
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={label}
      title={label}
      size="small"
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "text.secondary",
        opacity: mounted ? 1 : 0.7,
        "&:hover": {
          borderColor: "primary.main",
          color: "primary.main",
          bgcolor: "background.paper",
        },
      }}
    >
      {isDark ? (
        <Sun size={16} aria-hidden />
      ) : (
        <Moon size={16} aria-hidden />
      )}
    </IconButton>
  );
}
