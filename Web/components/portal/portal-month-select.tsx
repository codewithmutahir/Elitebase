"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import SelectMui from "@mui/material/Select";
import { useRouter } from "next/navigation";
import { groupPortalMonthsByYear } from "@/lib/portal/attendance";
import {
  formatPortalMonthLabel,
  formatPortalMonthName,
} from "@/lib/portal/format";
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
  const grouped = groupPortalMonthsByYear(options);

  return (
    <FormControl size="small" sx={{ minWidth: 0, width: { xs: "100%", sm: 200 } }}>
      <InputLabel id="portal-month-label">Month</InputLabel>
      <SelectMui
        labelId="portal-month-label"
        label="Month"
        value={month}
        aria-label="Month"
        renderValue={(value) => formatPortalMonthLabel(String(value))}
        onChange={(event) => {
          router.push(
            `${basePath}?month=${encodeURIComponent(String(event.target.value))}`
          );
        }}
        MenuProps={{
          PaperProps: {
            className: "dashboard-dropdown",
            sx: {
              backgroundImage: "none",
              bgcolor: "var(--eb-surface)",
              color: "var(--eb-text)",
              border: "1px solid var(--eb-border)",
              maxHeight: 360,
            },
          },
        }}
        sx={{
          ...portalSelectSx,
          width: "100%",
          minWidth: 0,
        }}
      >
        {grouped.flatMap(({ year, months }) => [
          <ListSubheader
            key={`year-${year}`}
            sx={{
              bgcolor: "var(--eb-surface)",
              color: "var(--eb-muted)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              lineHeight: "36px",
              textTransform: "uppercase",
            }}
          >
            {year}
          </ListSubheader>,
          ...months.map((value) => (
            <MenuItem
              key={value}
              value={value}
              sx={{
                color: "var(--eb-text)",
                fontSize: "0.875rem",
                pl: 2.5,
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
              {formatPortalMonthName(value)}
            </MenuItem>
          )),
        ])}
      </SelectMui>
    </FormControl>
  );
}
