"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  dashboardFormPanelSx,
  dashboardMetricLabelSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
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
    <Box sx={dashboardFormPanelSx}>
      <Box sx={{ mb: 1.5 }}>
        <Typography component="h3" sx={dashboardSectionTitleSx}>
          Export timesheets
        </Typography>
        <Typography
          sx={{ ...dashboardMetricLabelSx, mt: 0.25, fontSize: "0.75rem" }}
        >
          Download CSV for a month with attendance data. All employees exports are
          grouped by person with subtotals; single-employee exports stay chronological.
        </Typography>
      </Box>
      {months.length === 0 ? (
        <Typography sx={dashboardMetricLabelSx}>
          No attendance months available yet.
        </Typography>
      ) : (
        <Stack
          direction="row"
          useFlexGap
          sx={{ flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}
        >
          <Select
            id="export-month"
            label="Month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            displayEmpty={false}
            minWidth={180}
            options={months.map((value) => ({
              value,
              label: formatTimesheetMonthLabel(value),
            }))}
          />
          <Select
            id="export-employee"
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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
          <Select
            id="export-format"
            label="Format"
            value={format}
            onChange={(e) =>
              setFormat(e.target.value as "standard" | "quickbooks")
            }
            displayEmpty={false}
            minWidth={180}
            options={[
              { value: "standard", label: "Standard CSV" },
              { value: "quickbooks", label: "QuickBooks payroll" },
            ]}
          />
          {exportHref ? (
            <Button variant="outline" render={<Link href={exportHref} />}>
              Export CSV
            </Button>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
