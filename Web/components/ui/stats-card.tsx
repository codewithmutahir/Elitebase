"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { dashboardCardSx } from "@/lib/dashboard/sx";

export type StatsCardTrend = {
  label: string;
  tone?: StatusTone;
};

export type StatsCardProps = {
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: StatsCardTrend;
  className?: string;
  /** `dark` matches dashboard navy/gold shell; default `light` for legacy pages. */
  variant?: "light" | "dark";
};

export function StatsCard({
  icon,
  label,
  value,
  trend,
  className,
  variant = "light",
}: StatsCardProps) {
  const isDark = variant === "dark";

  return (
    <Card
      className={className}
      sx={
        isDark
          ? {
              ...dashboardCardSx,
              backdropFilter: "blur(4px)",
            }
          : undefined
      }
    >
      <CardContent sx={{ py: 2.5 }}>
        <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
          <Stack direction="row" sx={{ minWidth: 0, alignItems: "flex-start", gap: 1.5 }}>
            {icon ? (
              <Box
                sx={{
                  display: "flex",
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  ...(isDark
                    ? {
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "secondary.main",
                        color: "primary.main",
                      }
                    : {
                        bgcolor: "rgba(37, 99, 235, 0.08)",
                        color: "rgb(37, 99, 235)",
                      }),
                }}
              >
                {icon}
              </Box>
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: isDark ? "text.secondary" : "text.secondary",
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "1.875rem",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "text.primary",
                }}
              >
                {value}
              </Typography>
            </Box>
          </Stack>
          {trend ? (
            <StatusBadge tone={trend.tone ?? "neutral"} theme={isDark ? "dark" : "light"}>
              {trend.label}
            </StatusBadge>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
