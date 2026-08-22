"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { EditTimesheetDialog } from "@/components/timesheets/edit-timesheet-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { TimesheetRow } from "@/lib/timesheets/pairing";

type TimesheetsViewProps = {
  rows: TimesheetRow[];
  timezone: string | null | undefined;
  from: string;
  to: string;
  page: number;
  totalPages: number;
  total: number;
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

export function TimesheetsView({
  rows,
  timezone,
  from,
  to,
  page,
  totalPages,
  total,
}: TimesheetsViewProps) {
  const tz = companyTimezone(timezone);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalHours = useMemo(
    () => rows.reduce((sum, row) => sum + (row.totalHours ?? 0), 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        {from} – {to} · Page {page} of {totalPages}
      </p>

      <form
        method="get"
        className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
      >
        <div>
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} className="mt-1.5" />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total hours (this page)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalHours.toFixed(1)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Shifts on page</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total shifts in range</p>
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
              <DataTableHead>Hours</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead className="w-28">Actions</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <DataTableEmpty>
                    No attendance records for this date range.
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
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="grid gap-2 text-sm sm:grid-cols-3">
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
            {total} shift{total === 1 ? "" : "s"} in range
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/timesheets?from=${from}&to=${to}&page=${page - 1}`} />
                }
              >
                Previous
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={`/timesheets?from=${from}&to=${to}&page=${page + 1}`} />
                }
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
