import Link from "next/link";

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
  if (total === 0) return null;

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E2E8F0] px-6 py-4">
      <p className="text-sm text-[#64748B]">
        Page {page} of {totalPages} · {total} shift{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {prev ? (
          <Link
            href={pageHref(prev, from, to)}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#CBD5E1]">
            Previous
          </span>
        )}
        {next ? (
          <Link
            href={pageHref(next, from, to)}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#CBD5E1]">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
