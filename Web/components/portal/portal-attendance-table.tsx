import Box from "@mui/material/Box";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalLink } from "@/components/portal/portal-link";
import type { TimesheetExportRow } from "@/lib/timesheets/export-rows";
import {
  formatPortalHours,
  formatPortalPunch,
  portalShiftStatusLabel,
} from "@/lib/portal/format";
import { formatMoney } from "@/lib/money/format";
import { portalPanelSx } from "@/lib/portal/styles";

type PortalAttendanceTableProps = {
  rows: TimesheetExportRow[];
  timezone: string;
  currency: string | null;
  showWages?: boolean;
};

export function PortalAttendanceTable({
  rows,
  timezone,
  currency,
  showWages = false,
}: PortalAttendanceTableProps) {
  if (rows.length === 0) {
    return (
      <PortalEmptyState
        title="No attendance this month"
        description="When you clock in at the portal or kiosk, your shifts will show up here."
        action={
          <PortalLink
            href="/portal/clock"
            sx={{
              display: "inline-flex",
              borderRadius: 999,
              px: 2.25,
              py: 1.1,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
              "&:hover": { filter: "brightness(1.05)" },
            }}
          >
            Go to clock
          </PortalLink>
        }
      />
    );
  }

  return (
    <Box sx={{ ...portalPanelSx, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: showWages ? 640 : 560,
            "& th, & td": {
              px: 2,
              py: 1.5,
              textAlign: "left",
              fontSize: "0.875rem",
              borderBottom: "1px solid",
              borderColor: "divider",
              whiteSpace: "nowrap",
            },
            "& th": {
              color: "text.secondary",
              fontWeight: 500,
              bgcolor: "action.hover",
            },
            "& td": { color: "text.primary" },
            "& tr:last-child td": { borderBottom: "none" },
            "& tbody tr:hover td": {
              bgcolor: "action.hover",
            },
          }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>In</th>
              <th>Out</th>
              <th>Hours</th>
              <th>Status</th>
              {showWages ? <th>Est. pay</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = portalShiftStatusLabel(row.status, {
                absent: row.absent,
                unpaidLeave: row.unpaidLeave,
              });
              const lateHint = row.late
                ? " · Late"
                : row.onTime
                  ? " · On time"
                  : "";

              return (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{formatPortalPunch(row.clockIn, timezone)}</td>
                  <td>{formatPortalPunch(row.clockOut, timezone)}</td>
                  <td>{formatPortalHours(row.totalHours)}</td>
                  <td>
                    {status}
                    {row.clockIn ? lateHint : ""}
                  </td>
                  {showWages ? (
                    <td>{formatMoney(row.wages, currency)}</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
