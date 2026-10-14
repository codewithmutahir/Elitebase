"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { PendingButton } from "@/components/dashboard/pending-button";
import { usePendingNavigation } from "@/components/dashboard/use-pending-navigation";
import { EditTimesheetDialog } from "@/components/timesheets/edit-timesheet-dialog";
import { TimesheetsFilters } from "@/components/timesheets/timesheets-filters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  dashboardCardSx,
  dashboardMetricLabelSx,
  dashboardMetricValueSx,
  dashboardPageIntroSx,
} from "@/lib/dashboard/sx";
import { dashboardOutlineButtonClass } from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { companyTimezone, formatTime } from "@/lib/dashboard/format";
import type { TimesheetEmployeeOption } from "@/lib/timesheets/data";
import {
  formatTimesheetMonthLabel,
  formatTimesheetRangeLabel,
} from "@/lib/timesheets/labels";
import {
  isMissingClockIn,
  isMissingClockOut,
} from "@/lib/timesheets/missing-punches";
import type { TimesheetRow } from "@/lib/timesheets/pairing";
import type { TimesheetsViewParams } from "@/lib/timesheets/view-params";

/** Cap skeleton rows so pagination pending stays cheap (CSS-only MUI wave). */
const SKELETON_ROW_CAP = 8;

function TimesheetsTableSkeleton({ rowCount }: { rowCount: number }) {
  const count = Math.min(Math.max(rowCount, 4), SKELETON_ROW_CAP);

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <DataTableRow key={`timesheet-skel-${index}`} aria-hidden>
          <DataTableCell sx={{ width: 32 }}>
            <Skeleton variant="rounded" width={16} height={16} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width="72%" height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width={96} height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width={72} height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width={72} height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width={56} height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton variant="text" width={48} height={20} animation="wave" />
          </DataTableCell>
          <DataTableCell>
            <Skeleton
              variant="rounded"
              width={72}
              height={24}
              animation="wave"
            />
          </DataTableCell>
          <DataTableCell sx={{ width: 112 }}>
            <Skeleton
              variant="rounded"
              width={64}
              height={28}
              animation="wave"
            />
          </DataTableCell>
        </DataTableRow>
      ))}
    </>
  );
}

type TimesheetsViewProps = {
  rows: TimesheetRow[];
  timezone: string | null | undefined;
  months: string[];
  employees: TimesheetEmployeeOption[];
  selectedMonth: string | null;
  selectedEmployeeId: string;
  from: string;
  to: string;
  mode: TimesheetsViewParams["mode"];
  page: number;
  totalPages: number;
  total: number;
  queryBase: string;
};

function rowStatusBadge(row: TimesheetRow, theme: "light" | "dark") {
  if (row.status === "complete") {
    return (
      <StatusBadge tone="success" theme={theme}>
        Complete
      </StatusBadge>
    );
  }
  if (isMissingClockIn(row) && isMissingClockOut(row)) {
    return (
      <StatusBadge tone="error" theme={theme}>
        No punches
      </StatusBadge>
    );
  }
  if (isMissingClockIn(row)) {
    return (
      <StatusBadge tone="error" theme={theme}>
        Missing clock-in
      </StatusBadge>
    );
  }
  if (isMissingClockOut(row)) {
    return (
      <StatusBadge tone="warning" theme={theme}>
        Missing clock-out
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="error" theme={theme}>
      Incomplete
    </StatusBadge>
  );
}

function rangeSummary(
  mode: TimesheetsViewParams["mode"],
  month: string | null,
  from: string,
  to: string
) {
  if (mode === "month" && month && month !== "custom") {
    return formatTimesheetMonthLabel(month);
  }
  return formatTimesheetRangeLabel(from, to);
}

export function TimesheetsView({
  rows,
  timezone,
  months,
  employees,
  selectedMonth,
  selectedEmployeeId,
  from,
  to,
  mode,
  page,
  totalPages,
  total,
  queryBase,
}: TimesheetsViewProps) {
  const tz = companyTimezone(timezone);
  const { theme: dashboardTheme } = useDashboardTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    pending: navPending,
    activeKey: navKey,
    navigate,
  } = usePendingNavigation<"prev" | "next">();

  useEffect(() => {
    if (navPending) setExpandedId(null);
  }, [navPending]);

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + (row.totalHours ?? 0), 0),
    [rows]
  );

  const totalBreakHours = useMemo(
    () => rows.reduce((sum, row) => sum + (row.breakHours ?? 0), 0),
    [rows]
  );

  const skeletonRows = Math.min(rows.length || 6, SKELETON_ROW_CAP);

  const selectedEmployeeName = useMemo(
    () =>
      selectedEmployeeId === "all"
        ? null
        : employees.find((employee) => employee.id === selectedEmployeeId)
            ?.full_name,
    [employees, selectedEmployeeId]
  );

  function paginationHref(nextPage: number) {
    const separator = queryBase.includes("?") ? "&" : "?";
    return `/timesheets${queryBase || ""}${queryBase ? separator : "?"}page=${nextPage}`;
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography component="p" sx={dashboardPageIntroSx}>
          {rangeSummary(mode, selectedMonth, from, to)}
          {selectedEmployeeName ? ` · ${selectedEmployeeName}` : ""} · Page{" "}
          {page} of {totalPages}
        </Typography>
      </Stack>

      <TimesheetsFilters
        months={months}
        employees={employees}
        selectedMonth={selectedMonth}
        selectedEmployeeId={selectedEmployeeId}
        from={from}
        to={to}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ ...dashboardCardSx, p: 2 }}>
            <Typography sx={dashboardMetricLabelSx}>
              Total hours (this page)
            </Typography>
            {navPending ? (
              <Skeleton
                variant="text"
                width={72}
                height={40}
                animation="wave"
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography sx={dashboardMetricValueSx}>
                {totalHours.toFixed(1)}
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ ...dashboardCardSx, p: 2 }}>
            <Typography sx={dashboardMetricLabelSx}>
              Break hours (this page)
            </Typography>
            {navPending ? (
              <Skeleton
                variant="text"
                width={72}
                height={40}
                animation="wave"
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography sx={dashboardMetricValueSx}>
                {totalBreakHours.toFixed(1)}
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ ...dashboardCardSx, p: 2 }}>
            <Typography sx={dashboardMetricLabelSx}>
              {mode === "month"
                ? "Total shifts this month"
                : "Total shifts in range"}
            </Typography>
            {navPending ? (
              <Skeleton
                variant="text"
                width={56}
                height={40}
                animation="wave"
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography sx={dashboardMetricValueSx}>{total}</Typography>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card
        sx={{ ...dashboardCardSx, overflow: "hidden" }}
        aria-busy={navPending || undefined}
      >
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead sx={{ width: 32 }} />
              <DataTableHead>Employee</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Clock in</DataTableHead>
              <DataTableHead>Clock out</DataTableHead>
              <DataTableHead>Breaks</DataTableHead>
              <DataTableHead>Hours</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead sx={{ width: 112 }}>Actions</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {navPending ? (
              <TimesheetsTableSkeleton rowCount={skeletonRows} />
            ) : rows.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={9}>
                  <DataTableEmpty>
                    No attendance records for the selected filters.
                  </DataTableEmpty>
                </DataTableCell>
              </DataTableRow>
            ) : (
              rows.map((row) => {
                const isOpen = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <DataTableRow
                      sx={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpandedId(isOpen ? null : row.id)
                      }
                    >
                      <DataTableCell sx={{ color: "text.secondary" }}>
                        {isOpen ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </DataTableCell>
                      <DataTableCell sx={{ fontWeight: 600 }}>
                        {row.employeeName}
                      </DataTableCell>
                      <DataTableCell>
                        {row.clockOutDate
                          ? `${row.date} → ${row.clockOutDate}`
                          : row.date}
                      </DataTableCell>
                      <DataTableCell>
                        {row.clockIn ? formatTime(row.clockIn, tz) : "—"}
                      </DataTableCell>
                      <DataTableCell>
                        {row.clockOut ? formatTime(row.clockOut, tz) : "—"}
                      </DataTableCell>
                      <DataTableCell
                        sx={{
                          fontFamily: "var(--font-mono), monospace",
                          color: "text.secondary",
                        }}
                      >
                        {row.breakCount > 0
                          ? `${row.breakCount} · ${row.breakHours?.toFixed(2) ?? "0"}h`
                          : "—"}
                      </DataTableCell>
                      <DataTableCell
                        sx={{ fontFamily: "var(--font-mono), monospace" }}
                      >
                        {row.totalHours != null
                          ? row.totalHours.toFixed(2)
                          : "—"}
                      </DataTableCell>
                      <DataTableCell>
                        <Stack
                          direction="row"
                          useFlexGap
                          sx={{
                            flexWrap: "wrap",
                            gap: 0.75,
                            alignItems: "center",
                          }}
                        >
                          {rowStatusBadge(row, dashboardTheme)}
                          {row.needsReview ? (
                            <StatusBadge tone="warning" theme={dashboardTheme}>
                              Needs review
                            </StatusBadge>
                          ) : null}
                        </Stack>
                      </DataTableCell>
                      <DataTableCell onClick={(e) => e.stopPropagation()}>
                        <EditTimesheetDialog row={row} timezone={timezone} />
                      </DataTableCell>
                    </DataTableRow>
                    {isOpen ? (
                      <DataTableRow
                        sx={{
                          bgcolor: "action.hover",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <DataTableCell colSpan={9}>
                          <Stack
                            direction="row"
                            useFlexGap
                            sx={{
                              flexWrap: "wrap",
                              gap: 2,
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box
                              sx={{
                                display: "grid",
                                gap: 1,
                                fontSize: "0.875rem",
                                color: "text.primary",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  sm: "repeat(4, minmax(0, 1fr))",
                                },
                              }}
                            >
                              <Typography component="p" sx={{ m: 0 }}>
                                <Box
                                  component="span"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Employee ID:
                                </Box>{" "}
                                <Box
                                  component="span"
                                  sx={{
                                    fontFamily: "var(--font-mono), monospace",
                                  }}
                                >
                                  {row.employeeId}
                                </Box>
                              </Typography>
                              <Typography component="p" sx={{ m: 0 }}>
                                <Box
                                  component="span"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Shift status:
                                </Box>{" "}
                                {row.status}
                              </Typography>
                              <Typography component="p" sx={{ m: 0 }}>
                                <Box
                                  component="span"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Recorded hours:
                                </Box>{" "}
                                {row.totalHours ?? "In progress"}
                              </Typography>
                              <Typography component="p" sx={{ m: 0 }}>
                                <Box
                                  component="span"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Breaks:
                                </Box>{" "}
                                {row.breakCount > 0
                                  ? `${row.breakCount} (${row.breakHours?.toFixed(2) ?? "0"}h unpaid)`
                                  : "None recorded"}
                              </Typography>
                            </Box>
                            <EditTimesheetDialog
                              row={row}
                              timezone={timezone}
                            />
                          </Stack>
                        </DataTableCell>
                      </DataTableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </DataTableBody>
        </DataTable>
      </Card>

      {total > 0 ? (
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography component="p" sx={dashboardPageIntroSx}>
            {total} shift{total === 1 ? "" : "s"} matching filters
          </Typography>
          <Stack direction="row" spacing={1}>
            {page > 1 ? (
              <PendingButton
                type="button"
                variant="outline"
                size="sm"
                pending={navPending && navKey === "prev"}
                disabled={navPending}
                pendingLabel="Loading…"
                onClick={() => navigate(paginationHref(page - 1), "prev")}
                className={cn(dashboardOutlineButtonClass)}
              >
                Previous
              </PendingButton>
            ) : null}
            {page < totalPages ? (
              <PendingButton
                type="button"
                variant="outline"
                size="sm"
                pending={navPending && navKey === "next"}
                disabled={navPending}
                pendingLabel="Loading…"
                onClick={() => navigate(paginationHref(page + 1), "next")}
                className={cn(dashboardOutlineButtonClass)}
              >
                Next
              </PendingButton>
            ) : null}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}
