import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortalLink } from "@/components/portal/portal-link";
import { PortalStatCard } from "@/components/portal/portal-stat-card";
import { dateKeyInTimezone } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/money/format";
import { getPortalMonthSummary } from "@/lib/portal/attendance";
import { getPortalClockStatus } from "@/lib/portal/clock";
import {
  formatPortalHours,
  formatPortalMonthLabel,
  formatPortalPunch,
  portalShiftStatusLabel,
} from "@/lib/portal/format";
import { requireEmployeeSession } from "@/lib/portal/session";
import { portalPageTitleSx, portalPanelSx } from "@/lib/portal/styles";
import { listEmployeeTimeOffRequests } from "@/lib/time-off/queries";

function scheduleWindow(start: string | null, end: string | null) {
  if (!start || !end) return null;
  return `${start.slice(0, 5)} to ${end.slice(0, 5)}`;
}

function dayLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

const clockCtaSx = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  px: 2.5,
  py: 1.25,
  bgcolor: "primary.main",
  color: "primary.contrastText",
  fontWeight: 700,
  fontSize: "0.9375rem",
  textDecoration: "none",
  boxShadow: "0 8px 24px var(--eb-accent-glow)",
  "&:hover": { filter: "brightness(1.05)" },
  "&:active": { transform: "scale(0.98)" },
  "&:focus-visible": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: 3,
  },
} as const;

export default async function EmployeePortalHomePage() {
  const { employee } = await requireEmployeeSession();
  const [summary, clock, leave] = await Promise.all([
    getPortalMonthSummary(employee),
    getPortalClockStatus(employee),
    listEmployeeTimeOffRequests(employee.company_id, employee.id),
  ]);

  const firstName = employee.full_name.split(" ")[0] || employee.full_name;
  const todayKey = dateKeyInTimezone(new Date(), employee.company_timezone);
  const todayRow = summary.rows.find((row) => row.date === todayKey) ?? null;
  const pendingLeave = leave.filter((row) => row.status === "pending").length;
  const hoursWindow = scheduleWindow(
    employee.schedule_start_time,
    employee.schedule_end_time
  );
  const shiftsThisMonth = summary.completeShifts + summary.openShifts;

  let headline = "Ready for your shift";
  let detail = hoursWindow
    ? `Typical hours are ${hoursWindow} at ${employee.company_name}.`
    : `Your shift at ${employee.company_name} starts when you clock in.`;
  let cta = "Clock in";

  if (clock.onBreak) {
    headline = "You're on a break";
    detail = "Your shift stays open until you end the break.";
    cta = "End break";
  } else if (clock.isClockedIn) {
    headline = "You're on the clock";
    detail = clock.clockedInAt
      ? `Since ${formatPortalPunch(clock.clockedInAt, employee.company_timezone)} at ${employee.company_name}.`
      : `Your shift at ${employee.company_name} is open.`;
    cta = "Clock out";
  }

  const faceNote = !employee.company_allow_remote_punch
    ? null
    : employee.needs_reenrollment
      ? "Your face enrollment needs a refresh before you can punch from here."
      : !employee.face_registered_at
        ? "Enroll your face on the clock page before you punch from here."
        : null;

  const shiftHint =
    summary.openShifts > 0
      ? summary.openShifts === 1
        ? "1 still open"
        : `${summary.openShifts} still open`
      : shiftsThisMonth === 0
        ? "Your first shift will show up here."
        : undefined;

  return (
    <Stack spacing={3.5}>
      <Box
        sx={{
          ...portalPanelSx,
          borderRadius: "18px",
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 3, sm: 3.5 },
          backgroundImage:
            "radial-gradient(ellipse 80% 120% at 100% 0%, color-mix(in srgb, var(--eb-gold-500) 16%, transparent), transparent 55%)",
        }}
      >
        <Typography sx={{ color: "text.secondary", fontSize: "0.9375rem" }}>
          {firstName}
        </Typography>
        <Typography
          component="h1"
          sx={{ ...portalPageTitleSx, mt: 0.5, fontSize: { xs: "1.75rem", sm: "2rem" } }}
        >
          {headline}
        </Typography>
        <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 520 }}>
          {detail}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 2.5, alignItems: { xs: "stretch", sm: "center" } }}
        >
          <PortalLink href="/portal/clock" sx={clockCtaSx}>
            {cta}
          </PortalLink>
          {faceNote ? (
            <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
              {faceNote}
            </Typography>
          ) : null}
        </Stack>
      </Box>

      <Box>
        <Typography
          component="h2"
          sx={{ mb: 1.5, fontSize: "1rem", fontWeight: 560, color: "text.primary" }}
        >
          {formatPortalMonthLabel(summary.month)}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <PortalStatCard
            label="Hours"
            value={formatPortalHours(summary.totalHours)}
          />
          <PortalStatCard
            label="Estimated pay"
            value={formatMoney(summary.estimatedPay, employee.company_currency)}
          />
          <PortalStatCard
            label="Shifts"
            value={String(shiftsThisMonth)}
            hint={shiftHint}
          />
        </Box>
      </Box>

      <Box sx={{ ...portalPanelSx, px: { xs: 2.25, sm: 2.5 }, py: 2.25 }}>
        <Typography
          component="h2"
          sx={{ fontSize: "1rem", fontWeight: 560, color: "text.primary" }}
        >
          Today
        </Typography>
        {todayRow ? (
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <TodayFact label="Date" value={dayLabel(todayRow.date)} />
            <TodayFact
              label="In"
              value={formatPortalPunch(todayRow.clockIn, employee.company_timezone)}
            />
            <TodayFact
              label="Out"
              value={
                todayRow.clockOut
                  ? formatPortalPunch(todayRow.clockOut, employee.company_timezone)
                  : "Still open"
              }
            />
            <TodayFact
              label="Status"
              value={portalShiftStatusLabel(todayRow.status, {
                absent: todayRow.absent,
                unpaidLeave: todayRow.unpaidLeave,
              })}
            />
          </Box>
        ) : (
          <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 480 }}>
            No punches yet today. They will show here after you clock in.
          </Typography>
        )}
      </Box>

      {pendingLeave > 0 ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            ...portalPanelSx,
            px: 2.25,
            py: 2,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ color: "text.primary" }}>
            {pendingLeave === 1
              ? "1 leave request is waiting for approval."
              : `${pendingLeave} leave requests are waiting for approval.`}
          </Typography>
          <PortalLink
            href="/portal/leave"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View leave
          </PortalLink>
        </Stack>
      ) : null}
    </Stack>
  );
}

function TodayFact({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontWeight: 560,
          color: "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
