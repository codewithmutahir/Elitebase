"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { BarChart3, Clock, LogIn, Users } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardData } from "@/lib/dashboard/data";
import {
  attendanceLabel,
  formatDateTime,
  formatTime,
} from "@/lib/dashboard/format";
import { muiAlpha } from "@/lib/mui/alpha";
import { dashboardCardSx, dashboardPillLinkSx } from "@/lib/dashboard/sx";

type DashboardPageViewProps = {
  companyName: string;
  timezone: string;
  tzLabel: string;
  data: DashboardData;
};

export function DashboardPageView({
  companyName,
  timezone,
  tzLabel,
  data,
}: DashboardPageViewProps) {
  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 1400,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "primary.main",
            }}
          >
            Operations
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 0.5,
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "text.primary",
            }}
          >
            Live attendance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {companyName} · Times in {tzLabel}
          </Typography>
        </Box>
        <Stack
          direction="row"
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}
        >
          {data.clockedIn.length > 0 ? (
            <StatusBadge tone="success" theme="dark">
              {data.clockedIn.length} on the floor
            </StatusBadge>
          ) : null}
          <Box component={Link} href="/employees" sx={dashboardPillLinkSx}>
            View roster
          </Box>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatsCard
            variant="dark"
            label="Total employees"
            value={data.employeeCount}
            icon={<Users size={20} aria-hidden />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatsCard
            variant="dark"
            label="Clocked in now"
            value={data.clockedIn.length}
            trend={
              data.clockedIn.length > 0
                ? { label: "Live", tone: "success" }
                : undefined
            }
            icon={<Clock size={20} aria-hidden />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatsCard
            variant="dark"
            label="Today's clock-ins"
            value={data.todaysClockIns}
            icon={<LogIn size={20} aria-hidden />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <StatsCard
            variant="dark"
            label="This week hours"
            value={data.weekHours.toFixed(1)}
            icon={<BarChart3 size={20} aria-hidden />}
          />
        </Grid>
      </Grid>

      <Box component="section">
        <Stack
          direction="row"
          sx={{
            mb: 2,
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Typography
            component="h3"
            sx={{ fontSize: "1rem", fontWeight: 500, color: "text.primary" }}
          >
            Who&apos;s in
          </Typography>
          <StatusBadge tone="success" theme="dark">
            {data.clockedIn.length} active
          </StatusBadge>
        </Stack>

        {data.clockedIn.length === 0 ? (
          <Card sx={dashboardCardSx}>
            <CardContent sx={{ py: 7, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No one is clocked in right now.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block", opacity: 0.8 }}
              >
                Punches from your kiosk will show up here in real time.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={1.5}>
            {data.clockedIn.map((employee) => (
              <Grid
                key={employee.employeeId}
                size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}
              >
                <Card
                  sx={{
                    ...dashboardCardSx,
                    transition: "border-color 0.15s ease",
                    "&:hover": {
                      borderColor: (theme) =>
                        `${theme.palette.primary.main}40`,
                    },
                  }}
                >
                  <CardContent
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        width: 12,
                        height: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                          opacity: 0.7,
                          animation:
                            "mui-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                          "@keyframes mui-ping": {
                            "75%, 100%": { transform: "scale(2)", opacity: 0 },
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: "relative",
                          display: "inline-flex",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        noWrap
                        sx={{ fontWeight: 500, color: "text.primary" }}
                      >
                        {employee.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Since {formatTime(employee.lastTimestamp, timezone)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box component="section">
        <Card sx={{ ...dashboardCardSx, overflow: "hidden" }}>
          <CardHeader
            sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
          >
            <Typography
              component="h3"
              sx={{ fontSize: "1rem", fontWeight: 500, color: "text.primary" }}
            >
              Recent activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last 10 kiosk punches
            </Typography>
          </CardHeader>
          {data.recentAttendance.length === 0 ? (
            <CardContent sx={{ py: 5 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                No attendance yet. Activity appears after kiosk clock-ins.
              </Typography>
            </CardContent>
          ) : (
            <Table size="medium" aria-label="Recent kiosk punches">
              <TableBody>
                {data.recentAttendance.map((row, index) => (
                  <TableRow key={row.id} hover>
                    <TableCell
                      sx={{
                        width: 56,
                        verticalAlign: "middle",
                        pl: 2,
                        pr: 0,
                        borderBottom:
                          index < data.recentAttendance.length - 1
                            ? undefined
                            : "none",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          width: 24,
                          height: 24,
                          flexShrink: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          border: "1px solid",
                          borderColor: (theme) =>
                            muiAlpha(theme, (p) => p.primary.main, 0.3),
                          bgcolor: (theme) =>
                            muiAlpha(theme, (p) => p.primary.main, 0.1),
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          color: "primary.main",
                        }}
                      >
                        {index + 1}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: "middle",
                        borderBottom:
                          index < data.recentAttendance.length - 1
                            ? undefined
                            : "none",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.375,
                          py: 0.25,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 500,
                            lineHeight: 1.45,
                            color: "text.primary",
                          }}
                        >
                          {row.fullName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ lineHeight: 1.45 }}
                        >
                          {attendanceLabel(row.type)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        verticalAlign: "middle",
                        pr: 2,
                        whiteSpace: "nowrap",
                        borderBottom:
                          index < data.recentAttendance.length - 1
                            ? undefined
                            : "none",
                      }}
                    >
                      <Typography
                        component="time"
                        variant="body2"
                        color="text.secondary"
                        dateTime={row.timestamp}
                        sx={{
                          lineHeight: 1.45,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatDateTime(row.timestamp, timezone)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>
    </Box>
  );
}
