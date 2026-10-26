"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronDown, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import { updateEmployeeJobDetails } from "@/app/(dashboard)/employees/profile-actions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { CurrencyAmountInput } from "@/components/ui/currency-amount-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { SalaryIncrementsCard } from "@/components/team/profile/salary-increments-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCompany } from "@/contexts/company-context";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { resolveCurrency } from "@/lib/currencies";
import {
  dashboardAccentLinkSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileEditPanelSx,
  profileFieldLabelSx,
  profileKioskBannerSx,
  profileTimelineContentSx,
  profileTimelineDotMutedSx,
  profileTimelineDotSx,
  profileTimelineListSx,
  profileTimelineMarkerColSx,
  profileTimelineRailSx,
  profileTimelineRowSx,
  profileValueSx,
} from "@/lib/dashboard/sx";
import {
  formatDateShort,
  formatHourlyRate,
  formatMonthlySalary,
} from "@/lib/employees/format";
import { formatIncrementKind } from "@/lib/employees/salary-increments";
import { formatMoney } from "@/lib/money/format";
import type { EmployeeProfile, PayType } from "@/lib/employees/profile-queries";
import {
  ALL_ISO_DAYS,
  ISO_DAY_LABELS,
  WORKING_DAY_PRESETS,
  formatWorkingDaysLabel,
  normalizeWorkingDays,
  type WorkingDayPreset,
} from "@/lib/employees/working-days";
import {
  BONUS_POLICIES,
  cycleStartFromHireDate,
  formatBonusPolicyLabel,
  type BonusPolicy,
} from "@/lib/payroll/bonus";

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

type JobDetailsTabProps = {
  employee: EmployeeProfile;
  companyName: string;
  onUpdated: (patch: Partial<EmployeeProfile>) => void;
};

const cardHeaderRowSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
} as const;

const cardHeaderRowCenterSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

type LocationSettingKey =
  | "showInSchedule"
  | "sendLocationAlerts"
  | "includeInTimeClock"
  | "eligibleForOpenShifts"
  | "canWaiveMissedBreaks";

const LOCATION_SETTINGS: {
  key: LocationSettingKey;
  label: string;
  mutedLabel?: boolean;
}[] = [
  { key: "showInSchedule", label: "Show in Schedule" },
  { key: "sendLocationAlerts", label: "Send Location Alerts" },
  { key: "includeInTimeClock", label: "Include in Time Clock" },
  { key: "eligibleForOpenShifts", label: "Eligible for Open Shifts" },
  {
    key: "canWaiveMissedBreaks",
    label: "Can waive missed breaks",
    mutedLabel: true,
  },
];

const defaultLocationSettings: Record<LocationSettingKey, boolean> = {
  showInSchedule: true,
  sendLocationAlerts: true,
  includeInTimeClock: true,
  eligibleForOpenShifts: true,
  canWaiveMissedBreaks: false,
};

const locationSettingLabelSx = (muted?: boolean) =>
  ({
    m: 0,
    py: 0.25,
    alignItems: "center",
    gap: 0.5,
    "& .MuiCheckbox-root": {
      p: 0.5,
    },
    "& .MuiFormControlLabel-label": {
      fontSize: "0.875rem",
      lineHeight: 1.4,
      fontWeight: muted ? 400 : 500,
      color: muted ? "text.secondary" : "text.primary",
    },
  }) as const;

export function JobDetailsTab({
  employee,
  companyName,
  onUpdated,
}: JobDetailsTabProps) {
  const { company } = useCompany();
  const { theme: dashboardTheme } = useDashboardTheme();
  const currency = resolveCurrency(company.currency);
  const [editing, setEditing] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);
  const [locationSettings, setLocationSettings] = useState(
    defaultLocationSettings,
  );
  const [pending, startTransition] = useTransition();
  const [employmentType, setEmploymentType] = useState(
    employee.employment_type,
  );
  const [payType, setPayType] = useState<PayType>(employee.pay_type);
  const [hourlyRate, setHourlyRate] = useState(String(employee.hourly_rate));
  const [salaryAmount, setSalaryAmount] = useState(
    employee.salary_amount != null ? String(employee.salary_amount) : "",
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    employee.working_days,
  );
  const [hireDate, setHireDate] = useState(employee.hire_date ?? "");
  const [scheduleStart, setScheduleStart] = useState(
    employee.schedule_start_time ?? "09:00",
  );
  const [scheduleEnd, setScheduleEnd] = useState(
    employee.schedule_end_time ?? "17:00",
  );
  const [bonusAmount, setBonusAmount] = useState(
    String(employee.bonus_amount ?? 0),
  );
  const [bonusNote, setBonusNote] = useState(employee.bonus_note ?? "");
  const [bonusPolicy, setBonusPolicy] = useState<BonusPolicy>(
    employee.bonus_policy ?? "six_monthly",
  );
  const [bonusCycleStartMonth, setBonusCycleStartMonth] = useState(
    String(employee.bonus_cycle_start_month ?? 1),
  );

  function applyPreset(preset: WorkingDayPreset) {
    setWorkingDays([...WORKING_DAY_PRESETS[preset]]);
  }

  function toggleLocationSetting(key: LocationSettingKey) {
    setLocationSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function toggleWorkingDay(isoDay: number) {
    setWorkingDays((current) => {
      const normalized = normalizeWorkingDays(current);
      if (normalized.includes(isoDay)) {
        const next = normalized.filter((day) => day !== isoDay);
        return next.length > 0 ? next : normalized;
      }
      return normalizeWorkingDays([...normalized, isoDay]);
    });
  }

  function resetEditState() {
    setEmploymentType(employee.employment_type);
    setPayType(employee.pay_type);
    setHourlyRate(String(employee.hourly_rate));
    setSalaryAmount(
      employee.salary_amount != null ? String(employee.salary_amount) : "",
    );
    setWorkingDays(employee.working_days);
    setHireDate(employee.hire_date ?? "");
    setScheduleStart(employee.schedule_start_time ?? "09:00");
    setScheduleEnd(employee.schedule_end_time ?? "17:00");
    setBonusAmount(String(employee.bonus_amount ?? 0));
    setBonusNote(employee.bonus_note ?? "");
    setBonusPolicy(employee.bonus_policy ?? "six_monthly");
    setBonusCycleStartMonth(String(employee.bonus_cycle_start_month ?? 1));
  }

  function save() {
    startTransition(async () => {
      const cycleMonth = Number(bonusCycleStartMonth) || 1;
      const result = await updateEmployeeJobDetails(employee.id, {
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
        pay_type: payType,
        salary_amount: payType === "salary" ? Number(salaryAmount) || 0 : null,
        working_days: workingDays,
        schedule_start_time: scheduleStart,
        schedule_end_time: scheduleEnd,
        bonus_amount: Number(bonusAmount) || 0,
        bonus_note: bonusNote.trim() || null,
        bonus_policy: bonusPolicy,
        bonus_cycle_start_month: cycleMonth,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onUpdated({
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
        pay_type: payType,
        salary_amount: payType === "salary" ? Number(salaryAmount) || 0 : null,
        working_days: normalizeWorkingDays(workingDays),
        schedule_start_time: scheduleStart,
        schedule_end_time: scheduleEnd,
        bonus_amount: Number(bonusAmount) || 0,
        bonus_note: bonusNote.trim() || null,
        bonus_policy: bonusPolicy,
        bonus_cycle_start_month: cycleMonth,
        ...(result.loggedIncrement
          ? {
              salary_increments: [
                result.loggedIncrement,
                ...(employee.salary_increments ?? []),
              ],
            }
          : {}),
      });
      setEditing(false);
      toast.success("Job details saved");
    });
  }

  const roleLabel =
    employee.position || employee.department || employee.employment_type;

  const compensationLabel =
    employee.pay_type === "salary" && employee.salary_amount
      ? formatMonthlySalary(employee.salary_amount, currency)
      : formatHourlyRate(employee.hourly_rate, currency);

  const badgeTheme = dashboardTheme;

  return (
    <Stack spacing={3}>
      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Access, Roles & Wages
          </Typography>
          {!editing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
              aria-label="Edit job details"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Stack
            direction="row"
            useFlexGap
            sx={{ alignItems: "center", gap: 1 }}
          >
            <Typography sx={{ ...profileValueSx, fontWeight: 500 }}>
              {companyName}
            </Typography>
            {employee.status === "active" ? (
              <StatusBadge tone="success" theme={badgeTheme}>
                Active
              </StatusBadge>
            ) : (
              <StatusBadge tone="error" theme={badgeTheme}>
                Deactivated
              </StatusBadge>
            )}
          </Stack>

          {editing ? (
            <Box sx={profileEditPanelSx}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Select
                    label="Access"
                    value={employmentType}
                    onChange={(e) =>
                      setEmploymentType(
                        e.target.value as EmployeeProfile["employment_type"],
                      )
                    }
                    displayEmpty={false}
                    options={[
                      { value: "employee", label: "Employee" },
                      { value: "manager", label: "Manager" },
                      { value: "contractor", label: "Contractor" },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Select
                    label="Pay type"
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as PayType)}
                    displayEmpty={false}
                    options={[
                      { value: "hourly", label: "Hourly" },
                      { value: "salary", label: "Fixed salary (monthly)" },
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Input
                    label="Start date"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                  {payType === "hourly" ? (
                    <CurrencyAmountInput
                      id="hourly-rate"
                      label="Hourly rate"
                      value={hourlyRate}
                      onChange={setHourlyRate}
                      currency={currency}
                      variant="dashboard"
                    />
                  ) : (
                    <CurrencyAmountInput
                      id="monthly-salary"
                      label="Monthly salary"
                      value={salaryAmount}
                      onChange={setSalaryAmount}
                      currency={currency}
                      variant="dashboard"
                    />
                  )}
                </Grid>
              </Grid>

              <Stack spacing={1.5}>
                <Stack
                  direction="row"
                  useFlexGap
                  sx={{
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography component="label" sx={profileFieldLabelSx}>
                    Working days
                  </Typography>
                  <Stack
                    direction="row"
                    useFlexGap
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {(
                      Object.keys(WORKING_DAY_PRESETS) as WorkingDayPreset[]
                    ).map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.replace("-", " ")}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
                <Stack
                  direction="row"
                  useFlexGap
                  sx={{ flexWrap: "wrap", gap: 1.5 }}
                >
                  {ALL_ISO_DAYS.map((isoDay) => (
                    <FormControlLabel
                      key={isoDay}
                      control={
                        <Checkbox
                          size="small"
                          checked={normalizeWorkingDays(workingDays).includes(
                            isoDay,
                          )}
                          onChange={() => toggleWorkingDay(isoDay)}
                        />
                      }
                      label={ISO_DAY_LABELS[isoDay]}
                      sx={{
                        m: 0,
                        "& .MuiFormControlLabel-label": {
                          fontSize: "0.875rem",
                          color: "text.primary",
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Shift start"
                    type="time"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Shift end"
                    type="time"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Bonus amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Select
                    label="Bonus policy"
                    value={bonusPolicy}
                    displayEmpty={false}
                    onChange={(e) =>
                      setBonusPolicy(e.target.value as BonusPolicy)
                    }
                    options={BONUS_POLICIES.map((policy) => ({
                      value: policy,
                      label: formatBonusPolicyLabel(policy),
                    }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Select
                    label="Bonus cycle starts"
                    value={bonusCycleStartMonth}
                    displayEmpty={false}
                    onChange={(e) => setBonusCycleStartMonth(e.target.value)}
                    options={MONTH_OPTIONS.map((month) => ({
                      value: month.value,
                      label: month.label,
                    }))}
                  />
                  <Typography
                    sx={{
                      mt: 0.75,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                    }}
                  >
                    Default from hire month
                    {hireDate
                      ? ` (${MONTH_OPTIONS[cycleStartFromHireDate(hireDate) - 1]?.label})`
                      : ""}
                    .{" "}
                    <Box
                      component="button"
                      type="button"
                      onClick={() =>
                        setBonusCycleStartMonth(
                          String(cycleStartFromHireDate(hireDate || null))
                        )
                      }
                      sx={{
                        ...dashboardAccentLinkSx,
                        border: 0,
                        background: "none",
                        p: 0,
                        cursor: "pointer",
                        font: "inherit",
                      }}
                    >
                      Use hire month
                    </Box>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Input
                    label="Bonus note"
                    value={bonusNote}
                    onChange={(e) => setBonusNote(e.target.value)}
                    placeholder="Performance, signing…"
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={1}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetEditState();
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" disabled={pending} onClick={save}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  Access
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    ...profileValueSx,
                    mt: 0.5,
                    textTransform: "capitalize",
                  }}
                >
                  {employee.employment_type}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  PIN
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <RosterPinCell
                    employeeId={employee.id}
                    hasPin={employee.hasPin}
                    pin={employee.pin}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  Start Date
                </Typography>
                <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                  {formatDateShort(employee.hire_date)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  Role & Wages
                </Typography>
                <Stack
                  component="dd"
                  direction="row"
                  useFlexGap
                  sx={{
                    mt: 0.5,
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1,
                    m: 0,
                  }}
                >
                  <Typography sx={profileValueSx}>
                    {roleLabel} · {compensationLabel}
                  </Typography>
                  <StatusBadge tone="neutral" theme={badgeTheme}>
                    Primary role
                  </StatusBadge>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  Working days
                </Typography>
                <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                  {formatWorkingDaysLabel(employee.working_days)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Typography component="dt" sx={profileFieldLabelSx}>
                  Schedule
                </Typography>
                <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                  {employee.schedule_start_time?.slice(0, 5) ?? "09:00"} –{" "}
                  {employee.schedule_end_time?.slice(0, 5) ?? "17:00"}
                </Typography>
              </Grid>
              {employee.bonus_amount > 0 ? (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Typography component="dt" sx={profileFieldLabelSx}>
                    Bonus
                  </Typography>
                  <Typography
                    component="dd"
                    sx={{ ...profileValueSx, mt: 0.5 }}
                  >
                    {formatMoney(employee.bonus_amount, currency)}
                    {" · "}
                    {formatBonusPolicyLabel(employee.bonus_policy)}
                    {" · starts "}
                    {
                      MONTH_OPTIONS[employee.bonus_cycle_start_month - 1]
                        ?.label
                    }
                    {employee.bonus_note ? (
                      <Typography
                        component="span"
                        sx={{ ml: 0.5, color: "text.secondary" }}
                      >
                        ({employee.bonus_note})
                      </Typography>
                    ) : null}
                  </Typography>
                </Grid>
              ) : null}
            </Grid>
          )}

          <Box sx={profileKioskBannerSx}>
            <Typography component="p" sx={{ m: 0 }}>
              Kiosk face:{" "}
              {employee.needs_reenrollment ? (
                <Box
                  component="span"
                  sx={{ fontWeight: 500, color: "warning.light" }}
                >
                  Re-scan required at kiosk
                </Box>
              ) : employee.face_registered_at ? (
                <Box
                  component="span"
                  sx={{ fontWeight: 500, color: "success.light" }}
                >
                  Enrolled
                </Box>
              ) : (
                <Box
                  component="span"
                  sx={{ fontWeight: 500, color: "warning.light" }}
                >
                  Pending at kiosk
                </Box>
              )}
              {" · "}
              PIN {employee.hasPin ? "configured" : "not set"}
            </Typography>
            {employee.needs_reenrollment ? (
              <Typography
                sx={{
                  mt: 1,
                  fontSize: "0.75rem",
                  color: "warning.light",
                  opacity: 0.9,
                }}
              >
                Their face was enrolled under the previous recognition model.
                Next clock-in they will be guided to re-scan once.
              </Typography>
            ) : null}
          </Box>
        </CardContent>
      </Card>

      <SalaryIncrementsCard employee={employee} onUpdated={onUpdated} />

      <Card sx={dashboardCardSx}>
        <Box
          component="button"
          type="button"
          onClick={() => setLocationOpen((o) => !o)}
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            textAlign: "left",
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Location Settings
          </Typography>
          <ChevronDown
            className={
              locationOpen
                ? "size-5 rotate-180 text-[var(--eb-muted)] transition-transform"
                : "size-5 text-[var(--eb-muted)] transition-transform"
            }
            aria-hidden
          />
        </Box>
        {locationOpen ? (
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 2,
              fontSize: "0.875rem",
            }}
          >
            {LOCATION_SETTINGS.map(({ key, label, mutedLabel }) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    size="small"
                    checked={locationSettings[key]}
                    onChange={() => toggleLocationSetting(key)}
                  />
                }
                label={label}
                sx={locationSettingLabelSx(mutedLabel)}
              />
            ))}
          </CardContent>
        ) : null}
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowCenterSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Recent Job History
          </Typography>
          <Box
            component="button"
            type="button"
            sx={{
              ...dashboardAccentLinkSx,
              fontSize: "0.875rem",
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              p: 0,
              fontFamily: "inherit",
            }}
          >
            View all job history
          </Box>
        </CardHeader>
        <CardContent>
          <Box sx={{ position: "relative" }}>
            {employee.hire_date || (employee.salary_increments?.length ?? 0) > 0 ? (
              <Box component="span" sx={profileTimelineRailSx} aria-hidden />
            ) : null}
            <Stack component="ul" spacing={2} sx={profileTimelineListSx}>
            {(employee.salary_increments ?? []).slice(0, 3).map((row, index) => (
              <Box key={row.id} component="li" sx={profileTimelineRowSx}>
                <Box sx={profileTimelineMarkerColSx}>
                  <Box
                    component="span"
                    sx={
                      index === 0
                        ? profileTimelineDotSx
                        : profileTimelineDotMutedSx
                    }
                    aria-hidden
                  />
                </Box>
                <Box sx={profileTimelineContentSx}>
                  <Typography sx={{ ...profileValueSx, fontWeight: 500 }}>
                    {formatIncrementKind(row.kind)} ·{" "}
                    {row.increment_amount >= 0 ? "+" : ""}
                    {formatMoney(row.increment_amount, currency)}
                  </Typography>
                  <Typography
                    sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}
                  >
                    {formatDateShort(row.effective_date)}
                    {row.reason ? ` · ${row.reason}` : ""}
                  </Typography>
                </Box>
              </Box>
            ))}
            {employee.hire_date ? (
              <>
                <Box component="li" sx={profileTimelineRowSx}>
                  <Box sx={profileTimelineMarkerColSx}>
                    <Box
                      component="span"
                      sx={
                        (employee.salary_increments?.length ?? 0) === 0
                          ? profileTimelineDotSx
                          : profileTimelineDotMutedSx
                      }
                      aria-hidden
                    />
                  </Box>
                  <Box sx={profileTimelineContentSx}>
                    <Typography sx={{ ...profileValueSx, fontWeight: 500 }}>
                      Hired at {companyName}
                    </Typography>
                    <Typography
                      sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}
                    >
                      {formatDateShort(employee.hire_date)}
                    </Typography>
                  </Box>
                </Box>
                <Box component="li" sx={profileTimelineRowSx}>
                  <Box sx={profileTimelineMarkerColSx}>
                    <Box
                      component="span"
                      sx={profileTimelineDotMutedSx}
                      aria-hidden
                    />
                  </Box>
                  <Box sx={profileTimelineContentSx}>
                    <Typography sx={{ ...profileValueSx, fontWeight: 500 }}>
                      Started as {roleLabel} ({compensationLabel})
                    </Typography>
                    <Typography
                      sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}
                    >
                      {formatDateShort(employee.hire_date)}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (employee.salary_increments?.length ?? 0) === 0 ? (
              <Box
                component="li"
                sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}
              >
                No hire date or increments on file.
              </Box>
            ) : null}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Time Off Balances
          </Typography>
        </CardHeader>
        <CardContent sx={{ textAlign: "center", fontSize: "0.875rem" }}>
          <Typography sx={dashboardPageIntroSx}>
            No time off policies added yet.
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <Box
              component="button"
              type="button"
              sx={{
                ...dashboardAccentLinkSx,
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                p: 0,
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            >
              View all time off →
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
