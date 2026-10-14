"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { cancelPortalLeaveRequest } from "@/app/portal/(app)/leave/actions";
import { getUserFacingError } from "@/lib/errors/user-facing";
import {
  formatTimeOffType,
  type TimeOffRequestRow,
  type TimeOffRequestStatus,
} from "@/lib/time-off/queries";

function statusLabel(status: TimeOffRequestStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "denied":
      return "Denied";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function statusColor(status: TimeOffRequestStatus): string {
  switch (status) {
    case "approved":
      return "#86EFAC";
    case "denied":
      return "#FCA5A5";
    case "cancelled":
      return "var(--eb-muted)";
    default:
      return "var(--eb-gold-300)";
  }
}

function formatDateRange(start: string, end: string) {
  if (start === end) return start;
  return `${start} – ${end}`;
}

export function PortalLeaveList({
  requests,
}: {
  requests: TimeOffRequestRow[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onCancel(requestId: string) {
    if (pending || pendingId) return;
    setError(null);
    setPendingId(requestId);
    startTransition(async () => {
      try {
        const result = await cancelPortalLeaveRequest(requestId);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (caught) {
        setError(getUserFacingError(caught));
      } finally {
        setPendingId(null);
      }
    });
  }

  if (requests.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: "14px",
          border: "1px solid var(--eb-border)",
          bgcolor: "var(--eb-surface)",
          px: 2.5,
          py: 4,
          textAlign: "center",
        }}
      >
        <Typography sx={{ color: "var(--eb-muted)" }}>
          No leave requests yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: "1px solid var(--eb-border)",
        bgcolor: "var(--eb-surface)",
        overflow: "hidden",
      }}
    >
      {error ? (
        <Typography
          role="alert"
          sx={{
            px: 2,
            py: 1.5,
            color: "#FCA5A5",
            fontSize: "0.875rem",
            borderBottom: "1px solid var(--eb-border)",
          }}
        >
          {error}
        </Typography>
      ) : null}

      <Box sx={{ overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 560,
            "& th, & td": {
              px: 2,
              py: 1.5,
              textAlign: "left",
              fontSize: "0.875rem",
              borderBottom: "1px solid var(--eb-border)",
              whiteSpace: "nowrap",
            },
            "& th": {
              color: "var(--eb-muted)",
              fontWeight: 500,
              bgcolor: "rgba(255,255,255,0.02)",
            },
            "& td": { color: "var(--eb-text)" },
            "& tr:last-child td": { borderBottom: "none" },
          }}
        >
          <thead>
            <tr>
              <th>Dates</th>
              <th>Type</th>
              <th>Status</th>
              <th>Reason</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{formatDateRange(request.start_date, request.end_date)}</td>
                <td>{formatTimeOffType(request.request_type)}</td>
                <td style={{ color: statusColor(request.status) }}>
                  {statusLabel(request.status)}
                </td>
                <td
                  style={{
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={request.reason ?? undefined}
                >
                  {request.reason?.trim() || "—"}
                </td>
                <td>
                  {request.status === "pending" ? (
                    <Button
                      size="small"
                      variant="text"
                      disabled={pending && pendingId === request.id}
                      onClick={() => onCancel(request.id)}
                      sx={{
                        color: "var(--eb-muted)",
                        textTransform: "none",
                        minWidth: 0,
                        "&:hover": { color: "#FCA5A5" },
                      }}
                    >
                      {pending && pendingId === request.id
                        ? "Cancelling…"
                        : "Cancel"}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
