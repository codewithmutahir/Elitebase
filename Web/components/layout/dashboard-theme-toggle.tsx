"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useState, type MouseEvent } from "react";
import {
  useDashboardTheme,
  type DashboardThemePreference,
} from "@/contexts/dashboard-theme-context";

const OPTIONS: {
  value: DashboardThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function DashboardThemeToggle() {
  const { theme, preference, setPreference, mounted } = useDashboardTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const CurrentIcon =
    preference === "system" ? Monitor : theme === "dark" ? Moon : Sun;
  const label =
    preference === "system"
      ? `Theme: System (${theme})`
      : `Theme: ${preference === "dark" ? "Dark" : "Light"}`;

  function handleOpen(event: MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function choose(next: DashboardThemePreference) {
    setPreference(next);
    handleClose();
  }

  return (
    <>
      <IconButton
        type="button"
        onClick={handleOpen}
        disabled={!mounted}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
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
        <CurrentIcon size={16} aria-hidden />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            className: "dashboard-dropdown",
            sx: {
              mt: 1,
              minWidth: 160,
              backgroundImage: "none",
              bgcolor: "var(--eb-surface)",
              color: "var(--eb-text)",
              border: "1px solid var(--eb-border)",
            },
          },
        }}
      >
        {OPTIONS.map(({ value, label: optionLabel, icon: Icon }) => {
          const selected = preference === value;
          return (
            <MenuItem
              key={value}
              selected={selected}
              onClick={() => choose(value)}
              sx={{
                color: "var(--eb-text)",
                "&.Mui-selected": {
                  bgcolor: "rgba(217, 166, 63, 0.14)",
                  color: "var(--eb-text)",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "rgba(217, 166, 63, 0.2)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                <Icon size={16} aria-hidden />
              </ListItemIcon>
              <ListItemText primary={optionLabel} />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
