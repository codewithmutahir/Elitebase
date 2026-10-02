"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  dashboardFormPanelSx,
  dashboardMetricLabelSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
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
    <Box
      component="form"
      method="get"
      sx={dashboardFormPanelSx}
      onSubmit={() => setSubmitting(true)}
    >
      <Box>
        <Typography component="h3" sx={dashboardSectionTitleSx}>
          Filter timesheets
        </Typography>
        <Typography sx={{ ...dashboardMetricLabelSx, mt: 0.25 }}>
          Browse clock-in, breaks, and hours by month or a custom date range.
        </Typography>
      </Box>

      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}
      >
        <Select
          id="view-month"
          name="month"
          label="Month"
          value={month}
          onChange={(event) => handleMonthChange(event.target.value)}
          displayEmpty={false}
          minWidth={200}
          options={
            months.length === 0
              ? [{ value: "custom", label: "Custom date range" }]
              : [
                  ...months.map((value) => ({
                    value,
                    label: formatTimesheetMonthLabel(value),
                  })),
                  { value: "custom", label: "Custom date range" },
                ]
          }
        />

        <Select
          id="view-employee"
          name="employeeId"
          label="Employee"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          displayEmpty={false}
          minWidth={200}
          options={[
            { value: "all", label: "All employees" },
            ...employees.map((employee) => ({
              value: employee.id,
              label: employee.full_name,
            })),
          ]}
        />

        <PendingButton type="submit" pending={submitting} pendingLabel="Applying…">
          Apply
        </PendingButton>
      </Stack>

      {showCustomRange ? (
        <Stack
          direction="row"
          useFlexGap
          sx={{
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-end",
            borderTop: "1px solid",
            borderColor: "divider",
            pt: 2,
          }}
        >
          <Input
            id="from"
            name="from"
            label="From"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            id="to"
            name="to"
            label="To"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </Stack>
      ) : monthBounds ? (
        <>
          <input type="hidden" name="from" value={monthBounds.from} />
          <input type="hidden" name="to" value={monthBounds.to} />
          <Typography sx={{ ...dashboardMetricLabelSx, fontSize: "0.75rem" }}>
            Showing {formatTimesheetMonthLabel(month)} ({monthBounds.from} to{" "}
            {monthBounds.to})
          </Typography>
        </>
      ) : null}
    </Box>
  );
}
