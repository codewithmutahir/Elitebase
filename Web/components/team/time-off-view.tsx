"use client";

import { useMemo, useState, useTransition } from "react";
import {
  cancelTimeOffRequest,
  createTimeOffRequest,
  reviewTimeOffRequest,
} from "@/app/(dashboard)/team/time-off/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import {
  dashboardCardClass,
  dashboardHeadingClass,
  dashboardNativeSelectClass,
  dashboardPageIntroClass,
  dashboardSubheadingClass,
} from "@/lib/dashboard/styles";
import type { EmployeeListItem } from "@/lib/employees/queries";
import {
  formatTimeOffType,
  type TimeOffRequestRow,
  type TimeOffRequestStatus,
} from "@/lib/time-off/queries";
import { cn } from "@/lib/utils";

type TimeOffViewProps = {
  requests: TimeOffRequestRow[];
  employees: EmployeeListItem[];
};

function statusBadge(
  status: TimeOffRequestStatus,
  theme: "light" | "dark"
) {
  switch (status) {
    case "approved":
      return (
        <StatusBadge tone="success" theme={theme}>
          Approved
        </StatusBadge>
      );
    case "denied":
      return (
        <StatusBadge tone="error" theme={theme}>
          Denied
        </StatusBadge>
      );
    case "cancelled":
      return (
        <StatusBadge tone="neutral" theme={theme}>
          Cancelled
        </StatusBadge>
      );
    default:
      return (
        <StatusBadge tone="warning" theme={theme}>
          Pending
        </StatusBadge>
      );
  }
}

function formatDateRange(start: string, end: string) {
  if (start === end) return start;
  return `${start} – ${end}`;
}

export function TimeOffView({ requests, employees }: TimeOffViewProps) {
  const { theme: dashboardTheme } = useDashboardTheme();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestType, setRequestType] = useState<
    "vacation" | "sick" | "personal" | "unpaid"
  >("vacation");
  const [reason, setReason] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "active"),
    [employees]
  );

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pending").length,
    [requests]
  );

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTimeOffRequest({
        employeeId,
        startDate,
        endDate: endDate || startDate,
        requestType,
        reason,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setStartDate("");
      setEndDate("");
      setReason("");
    });
  }

  function handleReview(requestId: string, decision: "approved" | "denied") {
    setError(null);
    startTransition(async () => {
      const result = await reviewTimeOffRequest(requestId, decision);
      if (result.error) setError(result.error);
    });
  }

  function handleCancel(requestId: string) {
    setError(null);
    startTransition(async () => {
      const result = await cancelTimeOffRequest(requestId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className={dashboardHeadingClass}>Time Off</h2>
          <p className={cn("mt-1", dashboardPageIntroClass)}>
            Request and approve leave. Approved days block new shift assignments.
          </p>
        </div>
        {pendingCount > 0 ? (
          <StatusBadge tone="warning" theme={dashboardTheme}>
            {pendingCount} pending review
          </StatusBadge>
        ) : null}
      </div>

      <Card className={cn("p-4", dashboardCardClass)}>
        <h3 className={dashboardSubheadingClass}>New request</h3>
        <form
          onSubmit={handleCreate}
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          <div>
            <Label htmlFor="time-off-employee">Employee</Label>
            <select
              id="time-off-employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={cn(dashboardNativeSelectClass, "min-w-[200px]")}
              required
            >
              {activeEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="time-off-type">Type</Label>
            <select
              id="time-off-type"
              value={requestType}
              onChange={(e) =>
                setRequestType(
                  e.target.value as
                    | "vacation"
                    | "sick"
                    | "personal"
                    | "unpaid"
                )
              }
              className={cn(dashboardNativeSelectClass, "min-w-[140px]")}
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <Label htmlFor="time-off-start">Start</Label>
            <Input
              id="time-off-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor="time-off-end">End</Label>
            <Input
              id="time-off-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5"
              min={startDate || undefined}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <Label htmlFor="time-off-reason">Reason (optional)</Label>
            <Input
              id="time-off-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5"
              placeholder="Doctor visit, family trip…"
            />
          </div>
          <PendingButton
            type="submit"
            pending={pending}
            pendingLabel="Saving…"
            disabled={!employeeId}
          >
            Submit request
          </PendingButton>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </Card>

      <Card className={cn("overflow-hidden", dashboardCardClass)}>
        <DataTable>
          <DataTableHeader>
            <tr>
              <DataTableHead>Employee</DataTableHead>
              <DataTableHead>Dates</DataTableHead>
              <DataTableHead>Type</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Reason</DataTableHead>
              <DataTableHead className="w-40">Actions</DataTableHead>
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <DataTableEmpty>No time-off requests yet.</DataTableEmpty>
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <DataTableRow key={request.id}>
                  <DataTableCell className="font-semibold text-[var(--eb-text)]">
                    {request.employee_name}
                  </DataTableCell>
                  <DataTableCell>
                    {formatDateRange(request.start_date, request.end_date)}
                  </DataTableCell>
                  <DataTableCell>
                    {formatTimeOffType(request.request_type)}
                  </DataTableCell>
                  <DataTableCell>
                    {statusBadge(request.status, dashboardTheme)}
                  </DataTableCell>
                  <DataTableCell className="max-w-[200px] truncate text-[var(--eb-muted)]">
                    {request.reason || "—"}
                  </DataTableCell>
                  <DataTableCell>
                    {request.status === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() => handleReview(request.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => handleReview(request.id, "denied")}
                        >
                          Deny
                        </Button>
                      </div>
                    ) : request.status === "approved" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleCancel(request.id)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      "—"
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>
    </div>
  );
}
