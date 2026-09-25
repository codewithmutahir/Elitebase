import Link from "next/link";
import {
  BarChart3,
  Clock,
  LogIn,
  Users,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboardData } from "@/lib/dashboard/data";
import {
  attendanceLabel,
  companyTimezone,
  formatDateTime,
  formatTime,
} from "@/lib/dashboard/format";
import { requireCompanySession } from "@/lib/employees/session";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { company } = await requireCompanySession();
  const timezone = companyTimezone(company.timezone);
  const data = await getDashboardData(company.id, timezone);
  const tzLabel = timezone.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--eb-accent)]">
            Operations
          </p>
          <h2 className="mt-1 text-2xl font-normal tracking-[-0.02em] text-[var(--eb-text)] sm:text-[1.75rem]">
            Live attendance
          </h2>
          <p className="mt-1 text-sm text-[var(--eb-muted)]">
            {company.name} · Times in {tzLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.clockedIn.length > 0 ? (
            <StatusBadge tone="success" theme="dark">
              {data.clockedIn.length} on the floor
            </StatusBadge>
          ) : null}
          <Link
            href="/employees"
            className="rounded-full border border-[var(--eb-border)] bg-[var(--eb-elevated)]/60 px-4 py-2 text-sm font-medium text-[var(--eb-text)] transition-colors hover:border-[var(--eb-accent)]/40 hover:text-[var(--eb-accent)]"
          >
            View roster
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          variant="dark"
          label="Total employees"
          value={data.employeeCount}
          icon={<Users className="size-5" aria-hidden />}
        />
        <StatsCard
          variant="dark"
          label="Clocked in now"
          value={data.clockedIn.length}
          trend={
            data.clockedIn.length > 0
              ? { label: "Live", tone: "success" }
              : undefined
          }
          icon={<Clock className="size-5" aria-hidden />}
        />
        <StatsCard
          variant="dark"
          label="Today's clock-ins"
          value={data.todaysClockIns}
          icon={<LogIn className="size-5" aria-hidden />}
        />
        <StatsCard
          variant="dark"
          label="This week hours"
          value={data.weekHours.toFixed(1)}
          icon={<BarChart3 className="size-5" aria-hidden />}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-medium text-[var(--eb-text)]">
            Who&apos;s in
          </h3>
          <StatusBadge tone="success" theme="dark">
            {data.clockedIn.length} active
          </StatusBadge>
        </div>

        {data.clockedIn.length === 0 ? (
          <Card className="border-[var(--eb-border)] bg-[var(--eb-surface)]/80 ring-[var(--eb-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <CardContent className="py-14 text-center">
              <p className="text-sm text-[var(--eb-muted)]">
                No one is clocked in right now.
              </p>
              <p className="mt-2 text-xs text-[var(--eb-muted)]/80">
                Punches from your kiosk will show up here in real time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.clockedIn.map((employee) => (
              <Card
                key={employee.employeeId}
                className="border-[var(--eb-border)] bg-[var(--eb-surface)]/80 ring-[var(--eb-border)] transition-colors hover:border-[var(--eb-accent)]/25"
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="relative flex size-3 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--eb-text)]">
                      {employee.fullName}
                    </p>
                    <p className="text-xs text-[var(--eb-muted)]">
                      Since {formatTime(employee.lastTimestamp, timezone)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <Card className="border-[var(--eb-border)] bg-[var(--eb-surface)]/80 ring-[var(--eb-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <CardHeader className="border-b border-[var(--eb-border)]/80 pb-4">
            <h3 className="text-base font-medium text-[var(--eb-text)]">
              Recent activity
            </h3>
            <p className="text-sm text-[var(--eb-muted)]">
              Last 10 kiosk punches
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            {data.recentAttendance.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--eb-muted)]">
                No attendance yet. Activity appears after kiosk clock-ins.
              </p>
            ) : (
              <ul className="relative space-y-0">
                {data.recentAttendance.map((row, index) => (
                  <li
                    key={row.id}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    {index < data.recentAttendance.length - 1 ? (
                      <span
                        className="absolute left-[11px] top-6 h-full w-px bg-[var(--eb-border)]"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                        "border-[var(--eb-accent)]/30 bg-[var(--eb-accent)]/10 text-[var(--eb-accent)]"
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 border-b border-[var(--eb-border)]/60 pb-6 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[var(--eb-text)]">
                            {row.fullName}
                          </p>
                          <p className="text-sm text-[var(--eb-muted)]">
                            {attendanceLabel(row.type)}
                          </p>
                        </div>
                        <time
                          className="text-sm tabular-nums text-[var(--eb-muted)]"
                          dateTime={row.timestamp}
                        >
                          {formatDateTime(row.timestamp, timezone)}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
