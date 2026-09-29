"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  dashboardFormPanelClass,
  dashboardMetricLabelClass,
  dashboardNativeSelectClass,
  dashboardSectionTitleClass,
} from "@/lib/dashboard/styles";
import { formatTimesheetMonthLabel } from "@/lib/timesheets/labels";
import { API_V1 } from "@/lib/api/paths";
import type { TimesheetEmployeeOption } from "@/lib/timesheets/data";

type TimesheetsExportPanelProps = {
  months: string[];
  employees: TimesheetEmployeeOption[];
};

export function TimesheetsExportPanel({
  months,
  employees,
}: TimesheetsExportPanelProps) {
  const [month, setMonth] = useState(months[0] ?? "");
  const [employeeId, setEmployeeId] = useState("all");
  const [format, setFormat] = useState<"standard" | "quickbooks">("standard");

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
    if (format === "quickbooks") {
      params.set("format", "quickbooks");
    }
    return `${API_V1.timesheets.export}?${params.toString()}`;
  }, [month, employeeId, selectedEmployee, format]);

  return (
    <div className={dashboardFormPanelClass}>
      <div className="mb-3">
        <h3 className={dashboardSectionTitleClass}>Export timesheets</h3>
        <p className={`mt-0.5 text-xs ${dashboardMetricLabelClass}`}>
          Download CSV for a month with attendance data. All employees exports are
          grouped by person with subtotals; single-employee exports stay chronological.
        </p>
      </div>
      {months.length === 0 ? (
        <p className={`text-sm ${dashboardMetricLabelClass}`}>
          No attendance months available yet.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="export-month">Month</Label>
            <select
              id="export-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`${dashboardNativeSelectClass} min-w-[180px]`}
            >
              {months.map((value) => (
                <option key={value} value={value}>
                  {formatTimesheetMonthLabel(value)}
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
              className={`${dashboardNativeSelectClass} min-w-[200px]`}
            >
              <option value="all">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="export-format">Format</Label>
            <select
              id="export-format"
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as "standard" | "quickbooks")
              }
              className={`${dashboardNativeSelectClass} min-w-[180px]`}
            >
              <option value="standard">Standard CSV</option>
              <option value="quickbooks">QuickBooks payroll</option>
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
