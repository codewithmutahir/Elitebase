import { cn } from "@/lib/utils";

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/10",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-slate-400">app.elitebase.com/dashboard</span>
      </div>

      <div className="flex min-h-[280px] sm:min-h-[320px]">
        <aside className="hidden w-36 shrink-0 border-r border-slate-100 bg-white p-3 sm:block">
          <p className="text-xs font-bold text-blue-600">Elitebase</p>
          <div className="mt-4 space-y-1.5">
            <div className="rounded-md bg-blue-50 px-2 py-1.5 text-[10px] font-semibold text-blue-700">
              Dashboard
            </div>
            <div className="px-2 py-1.5 text-[10px] font-medium text-slate-500">
              Employees
            </div>
            <div className="px-2 py-1.5 text-[10px] font-medium text-slate-500">
              Timesheets
            </div>
            <div className="px-2 py-1.5 text-[10px] font-medium text-slate-500">
              Kiosk setup
            </div>
          </div>
        </aside>

        <div className="flex-1 bg-slate-50/80 p-4 sm:p-5">
          <p className="text-sm font-bold text-slate-900">Good morning, Riverside Café</p>
          <p className="text-xs text-slate-500">Who&apos;s working right now</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Employees", value: "24" },
              { label: "Clocked in", value: "8" },
              { label: "Today", value: "12" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm"
              >
                <p className="text-[10px] text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Recent activity
            </p>
            <div className="mt-2 space-y-2">
              {[
                "Alex M. — Clock in · 8:02 AM",
                "Jordan K. — Clock out · 7:58 AM",
                "Sam R. — Break end · 7:45 AM",
              ].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between text-[10px] text-slate-600"
                >
                  <span>{row}</span>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                    Live
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
