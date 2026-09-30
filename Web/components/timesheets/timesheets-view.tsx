"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { EditTimesheetDialog } from "@/components/timesheets/edit-timesheet-dialog";
import { TimesheetsFilters } from "@/components/timesheets/timesheets-filters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  dashboardCardClass,
  dashboardMetricLabelClass,
  dashboardMetricValueClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
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

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + (row.totalHours ?? 0), 0),
    [rows]
  );

  const totalBreakHours = useMemo(
    () => rows.reduce((sum, row) => sum + (row.breakHours ?? 0), 0),
    [rows]
  );

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={dashboardPageIntroClass}>
          {rangeSummary(mode, selectedMonth, from, to)}
          {selectedEmployeeName ? ` · ${selectedEmployeeName}` : ""} · Page{" "}
          {page} of {totalPages}
        </p>
      </div>

      <TimesheetsFilters
        months={months}
        employees={employees}
        selectedMonth={selectedMonth}
        selectedEmployeeId={selectedEmployeeId}
        from={from}
        to={to}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={cn("p-4", dashboardCardClass)}>
          <p className={dashboardMetricLabelClass}>Total hours (this page)</p>
          <p className={dashboardMetricValueClass}>{totalHours.toFixed(1)}</p>
        </Card>
        <Card className={cn("p-4", dashboardCardClass)}>
          <p className={dashboardMetricLabelClass}>Break hours (this page)</p>
          <p className={dashboardMetricValueClass}>
            {totalBreakHours.toFixed(1)}
          </p>
        </Card>
        <Card className={cn("p-4", dashboardCardClass)}>
          <p className={dashboardMetricLabelClass}>
            {mode === "month" ? "Total shifts this month" : "Total shifts in range"}
          </p>
          <p className={dashboardMetricValueClass}>{total}</p>
        </Card>
      </div>

      <Card className={cn("overflow-hidden", dashboardCardClass)}>
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead className="w-8" />
              <DataTableHead>Employee</DataTableHead>
              <DataTableHead>Date</DataTableHead>
              <DataTableHead>Clock in</DataTableHead>
              <DataTableHead>Clock out</DataTableHead>
              <DataTableHead>Breaks</DataTableHead>
              <DataTableHead>Hours</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="w-28">Actions</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <DataTableEmpty>
                    No attendance records for the selected filters.
                  </DataTableEmpty>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isOpen = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <DataTableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(isOpen ? null : row.id)
                      }
                    >
                      <DataTableCell className="text-[var(--eb-muted)]">
                        {isOpen ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </DataTableCell>
                      <DataTableCell className="font-semibold text-[var(--eb-text)]">
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
                      <DataTableCell className="font-mono text-[var(--eb-muted)]">
                        {row.breakCount > 0
                          ? `${row.breakCount} · ${row.breakHours?.toFixed(2) ?? "0"}h`
                          : "—"}
                      </DataTableCell>
                      <DataTableCell className="font-mono">
                        {row.totalHours != null
                          ? row.totalHours.toFixed(2)
                          : "—"}
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {rowStatusBadge(row, dashboardTheme)}
                          {row.needsReview ? (
                            <StatusBadge tone="warning" theme={dashboardTheme}>
                              Needs review
                            </StatusBadge>
                          ) : null}
                        </div>
                      </DataTableCell>
                      <DataTableCell onClick={(e) => e.stopPropagation()}>
                        <EditTimesheetDialog row={row} timezone={timezone} />
                      </DataTableCell>
                    </DataTableRow>
                    {isOpen ? (
                      <tr className="bg-[var(--eb-elevated)]/50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="grid gap-2 text-sm text-[var(--eb-text)] sm:grid-cols-4">
                              <p>
                                <span className="text-[var(--eb-muted)]">
                                  Employee ID:
                                </span>{" "}
                                <span className="font-mono">{row.employeeId}</span>
                              </p>
                              <p>
                                <span className="text-[var(--eb-muted)]">
                                  Shift status:
                                </span>{" "}
                                {row.status}
                              </p>
                              <p>
                                <span className="text-[var(--eb-muted)]">
                                  Recorded hours:
                                </span>{" "}
                                {row.totalHours ?? "In progress"}
                              </p>
                              <p>
                                <span className="text-[var(--eb-muted)]">Breaks:</span>{" "}
                                {row.breakCount > 0
                                  ? `${row.breakCount} (${row.breakHours?.toFixed(2) ?? "0"}h unpaid)`
                                  : "None recorded"}
                              </p>
                            </div>
                            <EditTimesheetDialog
                              row={row}
                              timezone={timezone}
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </DataTableBody>
        </DataTable>
      </Card>

      {total > 0 ? (
        <div className="flex items-center justify-between">
          <p className={dashboardPageIntroClass}>
            {total} shift{total === 1 ? "" : "s"} matching filters
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={paginationHref(page - 1)} />}
              >
                Previous
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={paginationHref(page + 1)} />}
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
