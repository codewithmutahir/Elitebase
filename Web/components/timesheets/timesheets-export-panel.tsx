"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useRef, useState } from "react";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  dashboardFormPanelSx,
  dashboardMetricLabelSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { dashboardOutlineButtonClass } from "@/lib/dashboard/styles";
import {
  filenameFromContentDisposition,
  triggerBlobDownload,
} from "@/lib/downloads/trigger-download";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { formatTimesheetMonthLabel } from "@/lib/timesheets/labels";
import { API_V1 } from "@/lib/api/paths";
import type { TimesheetEmployeeOption } from "@/lib/timesheets/data";
import { cn } from "@/lib/utils";

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
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);

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

  async function handleExport() {
    if (!exportHref || exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);

    try {
      const response = await fetch(exportHref, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "text/csv" },
      });

      if (!response.ok) {
        let message = "Could not export timesheets.";
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* non-JSON error body */
        }
        toast.error(message);
        return;
      }

      const blob = await response.blob();
      const filename = filenameFromContentDisposition(
        response.headers.get("Content-Disposition"),
        `timesheets-${month || "export"}.csv`
      );
      triggerBlobDownload(blob, filename);
      toast.success("Timesheet CSV downloaded");
    } catch (error) {
      console.error("timesheet export failed:", error);
      toast.error(getUserFacingError(error));
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  }

  return (
    <Box sx={dashboardFormPanelSx}>
      <Box sx={{ mb: 1.5 }}>
        <Typography component="h3" sx={dashboardSectionTitleSx}>
          Export timesheets
        </Typography>
        <Typography
          sx={{ ...dashboardMetricLabelSx, mt: 0.25, fontSize: "0.75rem" }}
        >
          Payroll-ready CSV with hours, pay type, rate, wages, and bonus.
          All-employee exports group by person with a subtotal row; names stay
          clean for import.
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
            disabled={exporting}
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
            disabled={exporting}
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
            disabled={exporting}
            options={[
              { value: "standard", label: "Payroll CSV" },
              { value: "quickbooks", label: "QuickBooks payroll" },
            ]}
          />
          {exportHref ? (
            <PendingButton
              type="button"
              variant="outline"
              pending={exporting}
              pendingLabel="Exporting…"
              disabled={!month}
              onClick={() => void handleExport()}
              className={cn(dashboardOutlineButtonClass)}
            >
              Export CSV
            </PendingButton>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
