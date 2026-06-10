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

export default async function DashboardPage() {
  const { company } = await requireCompanySession();
  const timezone = companyTimezone(company.timezone);
  const data = await getDashboardData(company.id, timezone);

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        Times in {timezone.replace(/_/g, " ")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total employees"
          value={data.employeeCount}
          icon={<Users className="size-5" aria-hidden />}
        />
        <StatsCard
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
          label="Today's clock-ins"
          value={data.todaysClockIns}
          icon={<LogIn className="size-5" aria-hidden />}
        />
        <StatsCard
          label="This week hours"
          value={data.weekHours.toFixed(1)}
          icon={<BarChart3 className="size-5" aria-hidden />}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Who&apos;s in</h2>
          <StatusBadge tone="success">{data.clockedIn.length} active</StatusBadge>
        </div>

        {data.clockedIn.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-slate-500">
              No one is clocked in right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.clockedIn.map((employee) => (
              <Card key={employee.employeeId}>
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {employee.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
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
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent activity
            </h2>
            <p className="text-sm text-slate-500">Last 10 kiosk punches</p>
          </CardHeader>
          <CardContent className="pt-0">
            {data.recentAttendance.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No attendance yet. Activity appears after kiosk clock-ins.
              </p>
            ) : (
              <ul className="relative space-y-0">
                {data.recentAttendance.map((row, index) => (
                  <li key={row.id} className="relative flex gap-4 pb-8 last:pb-0">
                    {index < data.recentAttendance.length - 1 ? (
                      <span
                        className="absolute left-[11px] top-6 h-full w-px bg-slate-200"
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.fullName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {attendanceLabel(row.type)}
                          </p>
                        </div>
                        <time className="text-sm text-slate-500">
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
