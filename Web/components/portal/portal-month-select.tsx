"use client";

import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import SelectMui from "@mui/material/Select";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { setNavigationPending } from "@/lib/navigation/navigation-pending-store";
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
  pending?: boolean;
  onMonthChange?: (month: string) => void;
};

export function PortalMonthSelect({
  basePath,
  month,
  options,
  pending: pendingProp,
  onMonthChange,
}: PortalMonthSelectProps) {
  const router = useRouter();
  const [localPending, startTransition] = useTransition();
  const pending = pendingProp ?? localPending;
  const grouped = groupPortalMonthsByYear(options);

  useEffect(() => {
    if (pendingProp !== undefined) return;
    if (!localPending) setNavigationPending(false);
  }, [localPending, pendingProp]);

  return (
    <FormControl
      size="small"
      sx={{ minWidth: 0, width: { xs: "100%", sm: 200 } }}
      disabled={pending}
    >
      <InputLabel id="portal-month-label">Month</InputLabel>
      <SelectMui
        labelId="portal-month-label"
        label="Month"
        value={month}
        aria-label="Month"
        aria-busy={pending}
        renderValue={(value) => formatPortalMonthLabel(String(value))}
        onChange={(event) => {
          const next = String(event.target.value);
          if (next === month) return;
          if (onMonthChange) {
            onMonthChange(next);
            return;
          }
          setNavigationPending(true);
          startTransition(() => {
            router.push(
              `${basePath}?month=${encodeURIComponent(next)}`
            );
          });
        }}
        endAdornment={
          pending ? (
            <CircularProgress
              size={16}
              sx={{ mr: 3, color: "primary.main" }}
              aria-hidden
            />
          ) : undefined
        }
        MenuProps={{
          slotProps: {
            paper: {
              className: "dashboard-dropdown",
              sx: {
                backgroundImage: "none",
                bgcolor: "var(--eb-surface)",
                color: "var(--eb-text)",
                border: "1px solid var(--eb-border)",
                maxHeight: 360,
              },
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
