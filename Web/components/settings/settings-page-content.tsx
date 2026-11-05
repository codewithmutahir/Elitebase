"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { updateCompanySettings } from "@/app/(dashboard)/settings/actions";
import { CurrencySelect } from "@/components/settings/currency-select";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { TimezoneSelect } from "@/components/auth/timezone-select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
  dashboardCardSx,
  dashboardFileInputSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";

type SettingsPageContentProps = {
  companyName: string;
  timezone: string | null;
  currency: string | null;
  logoUrl: string | null;
  leaveSickTotalDefault: number;
  leavePaidTotalDefault: number;
  leaveYearType: "calendar" | "anniversary";
  leaveProrateMidYear: boolean;
  lateGraceMinutes: number;
  latesPerDayDeduction: number;
  lateRemainderCarryMonth: boolean;
  saved: boolean;
  errorMessage: string | null;
};

export function SettingsPageContent({
  companyName,
  timezone,
  currency,
  logoUrl,
  leaveSickTotalDefault,
  leavePaidTotalDefault,
  leaveYearType,
  leaveProrateMidYear,
  lateGraceMinutes,
  latesPerDayDeduction,
  lateRemainderCarryMonth,
  saved,
  errorMessage,
}: SettingsPageContentProps) {
  const selectedTimezone = timezone ?? DEFAULT_TIMEZONE;
  const selectedCurrency = resolveCurrency(currency ?? DEFAULT_CURRENCY);

  return (
    <Box sx={{ mx: "auto", maxWidth: 768 }}>
      <Stack spacing={3}>
        {saved ? (
          <Typography component="p" sx={dashboardAlertSuccessSx}>
            Settings saved successfully.
          </Typography>
        ) : null}
        {errorMessage ? (
          <Typography component="p" sx={dashboardAlertErrorSx}>
            {errorMessage}
          </Typography>
        ) : null}

        <Box component="form" action={updateCompanySettings}>
          <Stack spacing={3}>
            <Card sx={dashboardCardSx}>
              <CardHeader>
                <Typography component="h2" sx={dashboardSectionTitleSx}>
                  Company info
                </Typography>
                <Typography sx={dashboardPageIntroSx}>
                  Name shown on your dashboard and kiosk experience.
                </Typography>
              </CardHeader>
              <CardContent>
                <Input
                  id="name"
                  name="name"
                  label="Company name"
                  required
                  defaultValue={companyName}
                />
              </CardContent>
            </Card>

            <Card sx={dashboardCardSx}>
              <CardHeader>
                <Typography component="h2" sx={dashboardSectionTitleSx}>
                  Appearance
                </Typography>
                <Typography sx={dashboardPageIntroSx}>
                  Logo displayed on kiosk idle screens and your admin header.
                </Typography>
              </CardHeader>
              <CardContent>
                <Stack spacing={2}>
                  {logoUrl ? (
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      <Image
                        src={logoUrl}
                        alt={`${companyName} logo`}
                        width={72}
                        height={72}
                        style={{
                          height: 64,
                          width: 64,
                          borderRadius: 8,
                          objectFit: "contain",
                          border: "1px solid var(--eb-border)",
                        }}
                        unoptimized
                      />
                      <Typography sx={dashboardPageIntroSx}>
                        Upload a new file to replace the current logo.
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography sx={dashboardPageIntroSx}>
                      No logo uploaded yet.
                    </Typography>
                  )}
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="logo"
                      sx={{
                        mb: 0.75,
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      Company logo
                    </Typography>
                    <Box
                      component="input"
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      sx={dashboardFileInputSx}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={dashboardCardSx}>
              <CardHeader>
                <Typography component="h2" sx={dashboardSectionTitleSx}>
                  Regional
                </Typography>
                <Typography sx={dashboardPageIntroSx}>
                  Timezone and currency used across schedules, timesheets, and pay
                  displays.
                </Typography>
              </CardHeader>
              <CardContent>
                <Stack spacing={3}>
                  <TimezoneSelect
                    options={[...US_TIMEZONES]}
                    defaultValue={selectedTimezone}
                  />
                  <CurrencySelect defaultValue={selectedCurrency} />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={dashboardCardSx}>
              <CardHeader>
                <Typography component="h2" sx={dashboardSectionTitleSx}>
                  Attendance policy
                </Typography>
                <Typography sx={dashboardPageIntroSx}>
                  Late margin after scheduled start, and how many lates in a
                  payroll month convert to one absent day for payslip deductions.
                </Typography>
              </CardHeader>
              <CardContent>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                      },
                    }}
                  >
                    <Input
                      id="late_grace_minutes"
                      name="late_grace_minutes"
                      label="Late margin (minutes)"
                      type="number"
                      required
                      defaultValue={String(lateGraceMinutes)}
                      min={0}
                      max={120}
                    />
                    <Input
                      id="lates_per_day_deduction"
                      name="lates_per_day_deduction"
                      label="Lates per absent day"
                      type="number"
                      required
                      defaultValue={String(latesPerDayDeduction)}
                      min={1}
                      max={30}
                    />
                  </Box>
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      fontSize: "0.875rem",
                      color: "text.primary",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      component="input"
                      type="checkbox"
                      name="late_remainder_carry_month"
                      defaultChecked={lateRemainderCarryMonth}
                      sx={{ mt: 0.35 }}
                    />
                    <span>
                      Carry leftover late count to the next payroll month
                      (otherwise remainder resets each month).
                    </span>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={dashboardCardSx}>
              <CardHeader>
                <Typography component="h2" sx={dashboardSectionTitleSx}>
                  Leave policy
                </Typography>
                <Typography sx={dashboardPageIntroSx}>
                  Annual allotments for new leave-year balances. Defaults: 6 sick
                  + 6 paid. Existing balance rows are not rewritten when you
                  change these defaults.
                </Typography>
              </CardHeader>
              <CardContent>
                <Stack spacing={3}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                      },
                    }}
                  >
                    <Input
                      id="leave_sick_total_default"
                      name="leave_sick_total_default"
                      label="Sick leave per year"
                      type="number"
                      required
                      defaultValue={String(leaveSickTotalDefault)}
                      min={0}
                      max={366}
                    />
                    <Input
                      id="leave_paid_total_default"
                      name="leave_paid_total_default"
                      label="Paid leave per year"
                      type="number"
                      required
                      defaultValue={String(leavePaidTotalDefault)}
                      min={0}
                      max={366}
                    />
                  </Box>
                  <Box>
                    <Typography
                      component="label"
                      htmlFor="leave_year_type"
                      sx={{
                        mb: 0.75,
                        display: "block",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      Leave year
                    </Typography>
                    <Box
                      component="select"
                      id="leave_year_type"
                      name="leave_year_type"
                      defaultValue={leaveYearType}
                      sx={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        px: 1.5,
                        py: 1.25,
                        fontSize: "0.875rem",
                        color: "text.primary",
                      }}
                    >
                      <option value="calendar">Calendar year (Jan–Dec)</option>
                      <option value="anniversary">
                        Anniversary year (from hire date)
                      </option>
                    </Box>
                  </Box>
                  <Box
                    component="label"
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      fontSize: "0.875rem",
                      color: "text.primary",
                      cursor: "pointer",
                    }}
                  >
                    <Box
                      component="input"
                      type="checkbox"
                      name="leave_prorate_mid_year"
                      defaultChecked={leaveProrateMidYear}
                      sx={{ mt: 0.35 }}
                    />
                    <span>
                      Pro-rate allotments for employees hired mid leave-year
                      (round to nearest day).
                    </span>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <SettingsSubmitButton />
            </Box>
          </Stack>
        </Box>

        <Card sx={dashboardCardSx}>
          <CardHeader>
            <Typography component="h2" sx={dashboardSectionTitleSx}>
              Locations & remote punch
            </Typography>
            <Typography sx={dashboardPageIntroSx}>
              Worksite pins for portal geofence, and enable employee face
              clock-in from the web portal.
            </Typography>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/locations"
              className="text-sm font-semibold text-[var(--eb-accent)] no-underline hover:underline"
            >
              Manage locations →
            </Link>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderColor: (theme) => `${theme.palette.error.main}40`,
            bgcolor: (theme) => `${theme.palette.error.main}0D`,
          }}
        >
          <CardHeader>
            <Typography
              component="h2"
              sx={{
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "error.main",
              }}
            >
              Danger zone
            </Typography>
            <Typography sx={dashboardPageIntroSx}>
              Permanently delete your company and all employee data. This cannot be
              undone.
            </Typography>
          </CardHeader>
          <CardContent>
            <Box
              component="button"
              type="button"
              disabled
              title="Contact support to delete your company account"
              sx={{
                cursor: "not-allowed",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: (theme) => `${theme.palette.error.main}4D`,
                bgcolor: "secondary.main",
                px: 2,
                py: 1,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: (theme) => `${theme.palette.error.main}B3`,
              }}
            >
              Delete company (contact support)
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
