"use client";

import { PendingButton } from "@/components/dashboard/pending-button";
import { usePendingNavigation } from "@/components/dashboard/use-pending-navigation";
import { dashboardOutlineButtonClass } from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";

type TimesheetsPaginationProps = {
  page: number;
  totalPages: number;
  from: string;
  to: string;
  total: number;
};

function pageHref(page: number, from: string, to: string) {
  const params = new URLSearchParams({ from, to, page: String(page) });
  return `/timesheets?${params.toString()}`;
}

export function TimesheetsPagination({
  page,
  totalPages,
  from,
  to,
  total,
}: TimesheetsPaginationProps) {
  const { pending, activeKey, navigate } = usePendingNavigation<
    "prev" | "next"
  >();

  if (total === 0) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--eb-border)] px-6 py-4">
      <p className="text-sm text-[var(--eb-muted)]">
        Page {page} of {totalPages} · {total} shift{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <PendingButton
            type="button"
            variant="outline"
            size="sm"
            pending={pending && activeKey === "prev"}
            disabled={pending}
            pendingLabel="Loading…"
            onClick={() => navigate(pageHref(prev, from, to), "prev")}
            className={cn(dashboardOutlineButtonClass)}
          >
            Previous
          </PendingButton>
        ) : (
          <span className="rounded-lg border border-[var(--eb-border)] px-4 py-2 text-sm font-semibold text-[var(--eb-muted)] opacity-50">
            Previous
          </span>
        )}
        {next ? (
          <PendingButton
            type="button"
            variant="outline"
            size="sm"
            pending={pending && activeKey === "next"}
            disabled={pending}
            pendingLabel="Loading…"
            onClick={() => navigate(pageHref(next, from, to), "next")}
            className={cn(dashboardOutlineButtonClass)}
          >
            Next
          </PendingButton>
        ) : (
          <span className="rounded-lg border border-[var(--eb-border)] px-4 py-2 text-sm font-semibold text-[var(--eb-muted)] opacity-50">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
