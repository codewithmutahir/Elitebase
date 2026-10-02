"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
import { Select } from "@/components/ui/select";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import {
  dashboardAlertErrorSx,
  dashboardCardSx,
  dashboardHeadingSx,
  dashboardPageIntroSx,
  dashboardSubheadingSx,
} from "@/lib/dashboard/sx";
import type { EmployeeListItem } from "@/lib/employees/queries";
import {
  formatTimeOffType,
  type TimeOffRequestRow,
  type TimeOffRequestStatus,
} from "@/lib/time-off/queries";

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
    "vacation" | "sick" | "personal" | "unpaid" | "paid_leave" | "unpaid_leave"
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
    <Stack spacing={3}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography component="h2" sx={dashboardHeadingSx}>
            Time Off
          </Typography>
          <Typography sx={{ ...dashboardPageIntroSx, mt: 0.5 }}>
            Request and approve leave. Approved days block new shift assignments.
          </Typography>
        </Box>
        {pendingCount > 0 ? (
          <StatusBadge tone="warning" theme={dashboardTheme}>
            {pendingCount} pending review
          </StatusBadge>
        ) : null}
      </Stack>

      <Card sx={{ ...dashboardCardSx, p: 2 }}>
        <Typography component="h3" sx={dashboardSubheadingSx}>
          New request
        </Typography>
        <Box
          component="form"
          onSubmit={handleCreate}
          sx={{
            mt: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 2,
          }}
        >
          <Select
            id="time-off-employee"
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            displayEmpty={false}
            minWidth={200}
            options={activeEmployees.map((employee) => ({
              value: employee.id,
              label: employee.full_name,
            }))}
          />
          <Select
            id="time-off-type"
            label="Type"
            value={requestType}
            onChange={(e) =>
              setRequestType(
                e.target.value as
                  | "vacation"
                  | "sick"
                  | "personal"
                  | "unpaid"
                  | "paid_leave"
                  | "unpaid_leave"
              )
            }
            displayEmpty={false}
            minWidth={140}
            options={[
              { value: "paid_leave", label: "Paid Leave" },
              { value: "unpaid_leave", label: "Unpaid Leave" },
              { value: "vacation", label: "Vacation" },
              { value: "sick", label: "Sick" },
              { value: "personal", label: "Personal" },
              { value: "unpaid", label: "Unpaid" },
            ]}
          />
          <Input
            id="time-off-start"
            label="Start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            id="time-off-end"
            label="End"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
          />
          <Box sx={{ minWidth: 180, flex: 1 }}>
            <Input
              id="time-off-reason"
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Doctor visit, family trip…"
            />
          </Box>
          <PendingButton
            type="submit"
            pending={pending}
            pendingLabel="Saving…"
            disabled={!employeeId}
          >
            Submit request
          </PendingButton>
        </Box>
        {error ? (
          <Typography component="p" role="alert" sx={{ ...dashboardAlertErrorSx, mt: 1.5 }}>
            {error}
          </Typography>
        ) : null}
      </Card>

      <Card sx={{ ...dashboardCardSx, overflow: "hidden" }}>
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Employee</DataTableHead>
              <DataTableHead>Dates</DataTableHead>
              <DataTableHead>Type</DataTableHead>
              <DataTableHead>By</DataTableHead>
              <DataTableHead>Status</DataTableHead>
              <DataTableHead>Reason</DataTableHead>
              <DataTableHead
                sx={{
                  minWidth: 220,
                  width: 220,
                  whiteSpace: "nowrap",
                }}
              >
                Actions
              </DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {requests.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={7}>
                  <DataTableEmpty>No time-off requests yet.</DataTableEmpty>
                </DataTableCell>
              </DataTableRow>
            ) : (
              requests.map((request) => (
                <DataTableRow key={request.id}>
                  <DataTableCell sx={{ fontWeight: 600 }}>
                    {request.employee_name}
                  </DataTableCell>
                  <DataTableCell>
                    {formatDateRange(request.start_date, request.end_date)}
                  </DataTableCell>
                  <DataTableCell>
                    {formatTimeOffType(request.request_type)}
                  </DataTableCell>
                  <DataTableCell
                    sx={{ textTransform: "capitalize", color: "text.secondary" }}
                  >
                    {request.requested_by === "employee" ? "Employee" : "Employer"}
                  </DataTableCell>
                  <DataTableCell>
                    {statusBadge(request.status, dashboardTheme)}
                  </DataTableCell>
                  <DataTableCell
                    sx={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "text.secondary",
                    }}
                  >
                    {request.reason || "—"}
                  </DataTableCell>
                  <DataTableCell
                    sx={{
                      minWidth: 220,
                      width: 220,
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    {request.status === "pending" ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "nowrap", alignItems: "center" }}
                      >
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          sx={{ flexShrink: 0 }}
                          onClick={() => handleReview(request.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          sx={{ flexShrink: 0 }}
                          onClick={() => handleReview(request.id, "denied")}
                        >
                          Deny
                        </Button>
                      </Stack>
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
    </Stack>
  );
}
