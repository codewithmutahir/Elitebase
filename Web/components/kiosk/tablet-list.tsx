"use client";

import { Tablet } from "lucide-react";
import { useTransition } from "react";
import { deactivateTablet } from "@/app/(dashboard)/kiosk-setup/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  dashboardCardClass,
  dashboardPageIntroClass,
  dashboardSectionTitleClass,
} from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
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
        className={cn(
          "flex flex-col items-center py-16 text-center",
          dashboardCardClass
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 text-[var(--eb-accent)]">
          <Tablet className="size-7" aria-hidden />
        </div>
        <h3 className={cn("mt-4", dashboardSectionTitleClass)}>No tablets found</h3>
        <p className={cn("mt-2 max-w-sm", dashboardPageIntroClass)}>
          Generate a setup code above, then enter it in the kiosk app on your
          first tablet.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", dashboardCardClass)}>
      <DataTable>
        <DataTableHeader>
          <tr>
            <DataTableHead>Location</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead>Last seen</DataTableHead>
            <DataTableHead>Setup code</DataTableHead>
            <DataTableHead className="text-right">Actions</DataTableHead>
          </tr>
        </DataTableHeader>
        <DataTableBody>
          {tablets.map((tablet) => (
            <DataTableRow key={tablet.id}>
              <DataTableCell className="font-semibold text-[var(--eb-text)]">
                {tablet.location_name ?? "Main Location"}
              </DataTableCell>
              <DataTableCell>
                <TabletStatus tablet={tablet} />
              </DataTableCell>
              <DataTableCell>{formatLastSeen(tablet.last_seen_at)}</DataTableCell>
              <DataTableCell className="font-mono text-[var(--eb-muted)]">
                {!tablet.tablet_token && tablet.setup_code
                  ? tablet.setup_code
                  : "—"}
              </DataTableCell>
              <DataTableCell className="text-right">
                {tablet.is_active ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deactivateTablet(tablet.id);
                      })
                    }
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </Card>
  );
}
