"use client";

import type { ReactNode } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import { usePendingNavigation } from "@/components/dashboard/use-pending-navigation";
import { PortalMonthSelect } from "@/components/portal/portal-month-select";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { setNavigationPending } from "@/lib/navigation/navigation-pending-store";

type PortalMonthPendingFrameProps = {
  basePath: string;
  month: string;
  options: string[];
  title: string;
  description?: ReactNode;
  /** Shown while the month soft-navigation transition is in flight. */
  skeleton: ReactNode;
  children: ReactNode;
};

/**
 * Employer-dashboard style: keep the filter chrome mounted and swap the data
 * region for a skeleton while `useTransition` navigation is pending.
 */
export function PortalMonthPendingFrame({
  basePath,
  month,
  options,
  title,
  description,
  skeleton,
  children,
}: PortalMonthPendingFrameProps) {
  const { pending, navigate } = usePendingNavigation();

  return (
    <Stack spacing={3} sx={{ minWidth: 0, width: "100%" }}>
      <PortalPageHeader
        title={title}
        description={description}
        action={
          <PortalMonthSelect
            basePath={basePath}
            month={month}
            options={options}
            pending={pending}
            onMonthChange={(next) => {
              if (next === month) return;
              setNavigationPending(true);
              navigate(
                `${basePath}?month=${encodeURIComponent(next)}`,
                "month"
              );
            }}
          />
        }
      />
      {pending ? (
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <LinearProgress
            aria-hidden
            sx={{
              height: 3,
              borderRadius: 999,
              bgcolor: "rgba(217,166,63,0.18)",
              ".dashboard-shell--dark &": {
                bgcolor: "rgba(217,166,63,0.12)",
              },
              "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
            }}
          />
          {skeleton}
        </Stack>
      ) : (
        children
      )}
    </Stack>
  );
}

