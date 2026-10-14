"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Tablet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  clearInactiveTablets,
  deactivateTablet,
} from "@/app/(dashboard)/kiosk-setup/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { dashboardDialogContentClass } from "@/lib/dashboard/styles";
import { getUserFacingError } from "@/lib/errors/user-facing";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const inactiveCount = tablets.filter((t) => !t.is_active).length;

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
    <>
      <Stack spacing={1.5}>
        {inactiveCount > 0 ? (
          <Stack
            direction="row"
            useFlexGap
            sx={{
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {inactiveCount} inactive tablet{inactiveCount === 1 ? "" : "s"} in
              this list
            </Typography>
            <Button
              type="button"
              size="small"
              variant="outlined"
              color="error"
              disabled={pending}
              sx={{ fontWeight: 600, textTransform: "none" }}
              onClick={() => {
                setActionError(null);
                setConfirmOpen(true);
              }}
            >
              Clear inactive
            </Button>
          </Stack>
        ) : null}

        {actionError ? (
          <Typography variant="body2" color="error" role="alert">
            {actionError}
          </Typography>
        ) : null}

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
                  <DataTableCell>
                    {formatLastSeen(tablet.last_seen_at)}
                  </DataTableCell>
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
                            setActionError(null);
                            try {
                              const result = await deactivateTablet(tablet.id);
                              if (result.error) {
                                setActionError(result.error);
                                return;
                              }
                              router.refresh();
                            } catch (error) {
                              console.error(error);
                              setActionError(getUserFacingError(error));
                            }
                          })
                        }
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        —
                      </Typography>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>
      </Stack>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!pending) setConfirmOpen(open);
        }}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>
              Clear {inactiveCount} inactive tablet
              {inactiveCount === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              This permanently removes deactivated tablets from the list.
              Clock-in history is kept. Active and awaiting-setup tablets are
              not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outlined"
              disabled={pending}
              sx={{ textTransform: "none" }}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              color="error"
              variant="contained"
              disabled={pending}
              sx={{ textTransform: "none", fontWeight: 600 }}
              onClick={() =>
                startTransition(async () => {
                  setActionError(null);
                  try {
                    const result = await clearInactiveTablets();
                    if (result.error) {
                      setActionError(result.error);
                      setConfirmOpen(false);
                      return;
                    }
                    setConfirmOpen(false);
                    router.refresh();
                  } catch (error) {
                    console.error(error);
                    setActionError(getUserFacingError(error));
                    setConfirmOpen(false);
                  }
                })
              }
            >
              {pending ? "Clearing…" : "Clear inactive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
