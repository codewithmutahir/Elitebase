"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { EditTimesheetDialog } from "@/components/timesheets/edit-timesheet-dialog";
import { TimesheetsFilters } from "@/components/timesheets/timesheets-filters";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function rowStatusBadge(row: TimesheetRow) {
  if (row.status === "complete") {
    return <StatusBadge tone="success">On time</StatusBadge>;
  }
  if (row.status === "open") {
    return <StatusBadge tone="warning">Open shift</StatusBadge>;
  }
  return <StatusBadge tone="error">Missing</StatusBadge>;
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
        <p className="text-sm text-slate-500">
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
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total hours (this page)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalHours.toFixed(1)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Break hours (this page)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalBreakHours.toFixed(1)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">
            {mode === "month" ? "Total shifts this month" : "Total shifts in range"}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
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
                      <DataTableCell className="text-slate-400">
                        {isOpen ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </DataTableCell>
                      <DataTableCell className="font-semibold text-slate-900">
                        {row.employeeName}
                      </DataTableCell>
                      <DataTableCell>{row.date}</DataTableCell>
                      <DataTableCell>
                        {row.clockIn ? formatTime(row.clockIn, tz) : "—"}
                      </DataTableCell>
                      <DataTableCell>
                        {row.clockOut ? formatTime(row.clockOut, tz) : "—"}
                      </DataTableCell>
                      <DataTableCell className="font-mono text-slate-600">
                        {row.breakCount > 0
                          ? `${row.breakCount} · ${row.breakHours?.toFixed(2) ?? "0"}h`
                          : "—"}
                      </DataTableCell>
                      <DataTableCell className="font-mono">
                        {row.totalHours != null
                          ? row.totalHours.toFixed(2)
                          : "—"}
                      </DataTableCell>
                      <DataTableCell>{rowStatusBadge(row)}</DataTableCell>
                      <DataTableCell onClick={(e) => e.stopPropagation()}>
                        <EditTimesheetDialog row={row} timezone={timezone} />
                      </DataTableCell>
                    </DataTableRow>
                    {isOpen ? (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="grid gap-2 text-sm sm:grid-cols-4">
                              <p>
                                <span className="text-slate-500">
                                  Employee ID:
                                </span>{" "}
                                <span className="font-mono text-slate-700">
                                  {row.employeeId}
                                </span>
                              </p>
                              <p>
                                <span className="text-slate-500">
                                  Shift status:
                                </span>{" "}
                                {row.status}
                              </p>
                              <p>
                                <span className="text-slate-500">
                                  Recorded hours:
                                </span>{" "}
                                {row.totalHours ?? "In progress"}
                              </p>
                              <p>
                                <span className="text-slate-500">Breaks:</span>{" "}
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
          <p className="text-sm text-slate-500">
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
