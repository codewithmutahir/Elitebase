"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Tablet } from "lucide-react";
import { useTransition } from "react";
import { deactivateTablet } from "@/app/(dashboard)/kiosk-setup/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import type { KioskTabletRow } from "@/lib/kiosk/queries";

function formatLastSeen(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TabletStatus({ tablet }: { tablet: KioskTabletRow }) {
  if (!tablet.is_active) {
    return <StatusBadge tone="error">Inactive</StatusBadge>;
  }
  if (tablet.tablet_token) {
    return <StatusBadge tone="success">Registered</StatusBadge>;
  }
  return <StatusBadge tone="warning">Awaiting setup</StatusBadge>;
}

export function TabletList({ tablets }: { tablets: KioskTabletRow[] }) {
  const [pending, startTransition] = useTransition();

  if (tablets.length === 0) {
    return (
      <Card
        sx={{
          ...dashboardCardSx,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 8,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            height: 56,
            width: 56,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "16px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: (theme) => `${theme.palette.secondary.main}CC`,
            color: "primary.main",
          }}
        >
          <Tablet className="size-7" aria-hidden />
        </Box>
        <Typography component="h3" sx={{ ...dashboardSectionTitleSx, mt: 2 }}>
          No tablets found
        </Typography>
        <Typography sx={{ ...dashboardPageIntroSx, mt: 1, maxWidth: 384 }}>
          Generate a setup code above, then enter it in the kiosk app on your
          first tablet.
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ ...dashboardCardSx, overflow: "hidden" }}>
      <DataTable>
        <DataTableHeader>
          <DataTableRow>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Last seen</DataTableHead>
            <DataTableHead>Setup code</DataTableHead>
            <DataTableHead align="right">Actions</DataTableHead>
          </DataTableRow>
        </DataTableHeader>
        <DataTableBody>
          {tablets.map((tablet) => (
            <DataTableRow key={tablet.id}>
              <DataTableCell sx={{ fontWeight: 600 }}>
                {tablet.location_name ?? "Main Location"}
              </DataTableCell>
              <DataTableCell>
                <TabletStatus tablet={tablet} />
              </DataTableCell>
              <DataTableCell>{formatLastSeen(tablet.last_seen_at)}</DataTableCell>
              <DataTableCell
                sx={{
                  fontFamily: "var(--font-mono), monospace",
                  color: "text.secondary",
                }}
              >
                {!tablet.tablet_token && tablet.setup_code
                  ? tablet.setup_code
                  : "—"}
              </DataTableCell>
              <DataTableCell align="right">
                {tablet.is_active ? (
                  <Button
                    type="button"
                    size="small"
                    disabled={pending}
                    color="error"
                    sx={{ fontWeight: 600, textTransform: "none" }}
                    onClick={() =>
                      startTransition(async () => {
                        await deactivateTablet(tablet.id);
                      })
                    }
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Typography component="span" variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
