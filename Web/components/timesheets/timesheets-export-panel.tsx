"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TimesheetEmployeeOption } from "@/lib/timesheets/data";

type TimesheetsExportPanelProps = {
  months: string[];
  employees: TimesheetEmployeeOption[];
};

function formatMonthLabel(month: string) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNum - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function TimesheetsExportPanel({
  months,
  employees,
}: TimesheetsExportPanelProps) {
  const [month, setMonth] = useState(months[0] ?? "");
  const [employeeId, setEmployeeId] = useState("all");

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === employeeId),
    [employees, employeeId]
  );

  const exportHref = useMemo(() => {
    if (!month) return null;
    const params = new URLSearchParams({ month });
    if (employeeId !== "all") {
      params.set("employeeId", employeeId);
      if (selectedEmployee?.full_name) {
        params.set("employeeName", selectedEmployee.full_name);
      }
    }
    return `/api/timesheets/export?${params.toString()}`;
  }, [month, employeeId, selectedEmployee]);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Export timesheets</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Download CSV for a month with attendance data — all employees or one person.
        </p>
      </div>
      {months.length === 0 ? (
        <p className="text-sm text-slate-500">No attendance months available yet.</p>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="export-month">Month</Label>
            <select
              id="export-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1.5 block min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {months.map((value) => (
                <option key={value} value={value}>
                  {formatMonthLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="export-employee">Employee</Label>
            <select
              id="export-employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1.5 block min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="all">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
          {exportHref ? (
            <Button variant="outline" render={<Link href={exportHref} />}>
              Export CSV
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
