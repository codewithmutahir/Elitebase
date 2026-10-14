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
  saved: boolean;
  errorMessage: string | null;
};

export function SettingsPageContent({
  companyName,
  timezone,
  currency,
  logoUrl,
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
