import { cn } from "@/lib/utils";

const stats = [
  { label: "Present", value: "24", tone: "text-emerald-400" },
  { label: "Late", value: "3", tone: "text-amber-400" },
  { label: "Away", value: "5", tone: "text-[var(--eb-muted)]" },
] as const;

const activity = [
  { name: "Alex Morgan", time: "8:02 AM", status: "Clock in", ok: true },
  { name: "Jordan Kim", time: "8:05 AM", status: "Clock in", ok: true },
  { name: "Sam Rivera", time: "8:11 AM", status: "Late", ok: false },
  { name: "Casey Brooks", time: "7:58 AM", status: "Clock in", ok: true },
] as const;

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--eb-border)] bg-[var(--eb-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
        className
      )}
      role="img"
      aria-label="Elitebase dashboard showing live attendance"
    >
      <div className="flex items-center gap-2 border-b border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
        <span
          data-mono
          className="ml-3 text-[11px] text-[var(--eb-muted)]"
        >
          app.elitebase.com/dashboard
        </span>
      </div>

      <div className="flex min-h-[300px] sm:min-h-[380px]">
        <aside className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-[var(--eb-border)] bg-[var(--eb-elevated)]/50 py-4 sm:flex md:w-40 md:items-stretch md:px-3">
          <p className="hidden text-xs font-semibold text-[var(--eb-accent)] md:block">
            Elitebase
          </p>
          <div className="mt-1 flex flex-col gap-1.5 md:mt-3">
            {["Dashboard", "Team", "Timesheets", "Kiosk"].map((item, i) => (
              <div
                key={item}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-[10px] font-medium md:text-[11px]",
                  i === 0
                    ? "bg-[var(--eb-accent)]/15 text-[var(--eb-accent)]"
                    : "text-[var(--eb-muted)]"
                )}
              >
                <span className="md:inline">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 bg-[var(--eb-ink)]/40 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--eb-text)] sm:text-base">
                Live attendance
              </p>
              <p className="text-xs text-[var(--eb-muted)]">
                Riverside Café · Today
              </p>
            </div>
            <span
              data-mono
              className="rounded-full border border-[var(--eb-border)] bg-[var(--eb-elevated)] px-2.5 py-1 text-[10px] text-emerald-400"
            >
              Live
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 p-3"
              >
                <p className="text-[10px] text-[var(--eb-muted)]">{stat.label}</p>
                <p
                  data-mono
                  className={cn("mt-1 text-xl font-semibold sm:text-2xl", stat.tone)}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--eb-border)] bg-[var(--eb-elevated)]/60">
            <div className="flex items-center justify-between border-b border-[var(--eb-border)] px-3 py-2.5">
              <p className="text-[11px] font-semibold text-[var(--eb-text)]">
                Activity feed
              </p>
              <p data-mono className="text-[10px] text-[var(--eb-muted)]">
                Updated now
              </p>
            </div>
            <div className="divide-y divide-[var(--eb-border)]">
              {activity.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-[var(--eb-text)]">
                      {row.name}
                    </p>
                    <p data-mono className="text-[10px] text-[var(--eb-muted)]">
                      {row.time}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      row.ok
                        ? "bg-emerald-400/15 text-emerald-400"
                        : "bg-amber-400/15 text-amber-400"
                    )}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
