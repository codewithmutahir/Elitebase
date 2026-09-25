"use client";

import { useMemo, useState } from "react";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dashboardFormPanelClass,
  dashboardMetricLabelClass,
  dashboardNativeSelectClass,
  dashboardSectionTitleClass,
} from "@/lib/dashboard/styles";
import { getMonthRange } from "@/lib/timesheets/dates";
import { formatTimesheetMonthLabel } from "@/lib/timesheets/labels";
import type { TimesheetEmployeeOption } from "@/lib/timesheets/data";

type TimesheetsFiltersProps = {
  months: string[];
  employees: TimesheetEmployeeOption[];
  selectedMonth: string | null;
  selectedEmployeeId: string;
  from: string;
  to: string;
};

export function TimesheetsFilters({
  months,
  employees,
  selectedMonth,
  selectedEmployeeId,
  from,
  to,
}: TimesheetsFiltersProps) {
  const initialMonth = selectedMonth ?? months[0] ?? "custom";
  const [month, setMonth] = useState(initialMonth ?? "custom");
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId);
  const [fromDate, setFromDate] = useState(from);
  const [toDate, setToDate] = useState(to);
  const [submitting, setSubmitting] = useState(false);

  const showCustomRange = month === "custom";

  const monthBounds = useMemo(() => {
    if (month === "custom") return null;
    return getMonthRange(month);
  }, [month]);

  function handleMonthChange(value: string) {
    setMonth(value);
    const range = value !== "custom" ? getMonthRange(value) : null;
    if (range) {
      setFromDate(range.from);
      setToDate(range.to);
    }
  }

  return (
    <form
      method="get"
      className={dashboardFormPanelClass}
      onSubmit={() => setSubmitting(true)}
    >
      <div>
        <h3 className={dashboardSectionTitleClass}>Filter timesheets</h3>
        <p className={`mt-0.5 ${dashboardMetricLabelClass}`}>
          Browse clock-in, breaks, and hours by month or a custom date range.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label htmlFor="view-month">Month</Label>
          <select
            id="view-month"
            name="month"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
            className={`${dashboardNativeSelectClass} min-w-[200px]`}
          >
            {months.length === 0 ? (
              <option value="custom">Custom date range</option>
            ) : (
              <>
                {months.map((value) => (
                  <option key={value} value={value}>
                    {formatTimesheetMonthLabel(value)}
                  </option>
                ))}
                <option value="custom">Custom date range</option>
              </>
            )}
          </select>
        </div>

        <div>
          <Label htmlFor="view-employee">Employee</Label>
          <select
            id="view-employee"
            name="employeeId"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
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

        <PendingButton type="submit" pending={submitting} pendingLabel="Applying…">
          Apply
        </PendingButton>
      </div>

      {showCustomRange ? (
        <div className="flex flex-wrap items-end gap-4 border-t border-[var(--eb-border)] pt-4">
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              name="from"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              name="to"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      ) : monthBounds ? (
        <>
          <input type="hidden" name="from" value={monthBounds.from} />
          <input type="hidden" name="to" value={monthBounds.to} />
          <p className={`text-xs ${dashboardMetricLabelClass}`}>
            Showing {formatTimesheetMonthLabel(month)} ({monthBounds.from} to{" "}
            {monthBounds.to})
          </p>
        </>
      ) : null}
    </form>
  );
}
