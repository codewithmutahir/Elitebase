"use client";

import MenuItem from "@mui/material/MenuItem";
import SelectMui from "@mui/material/Select";
import { useRouter } from "next/navigation";
import { formatPortalMonthLabel } from "@/lib/portal/format";
import { portalSelectSx } from "@/lib/portal/styles";

type PortalMonthSelectProps = {
  basePath: string;
  month: string;
  options: string[];
};

export function PortalMonthSelect({
  basePath,
  month,
  options,
}: PortalMonthSelectProps) {
  const router = useRouter();

  return (
    <SelectMui
      value={month}
      size="small"
      aria-label="Month"
      onChange={(event) => {
        router.push(
          `${basePath}?month=${encodeURIComponent(String(event.target.value))}`
        );
      }}
      MenuProps={{
        slotProps: {
          paper: {
            className: "dashboard-dropdown",
            sx: {
              backgroundImage: "none",
              bgcolor: "var(--eb-surface)",
              color: "var(--eb-text)",
              border: "1px solid var(--eb-border)",
            },
          },
        },
      }}
      sx={portalSelectSx}
    >
      {options.map((value) => (
        <MenuItem
          key={value}
          value={value}
          sx={{
            color: "var(--eb-text)",
            fontSize: "0.875rem",
            "&.Mui-selected": {
              bgcolor: "rgba(217, 166, 63, 0.16)",
              color: "var(--eb-text)",
            },
            "&.Mui-selected:hover": {
              bgcolor: "rgba(217, 166, 63, 0.22)",
            },
            "&:hover": {
              bgcolor: "var(--eb-hover-overlay)",
            },
          }}
        >
          {formatPortalMonthLabel(value)}
        </MenuItem>
      ))}
    </SelectMui>
  );
}
