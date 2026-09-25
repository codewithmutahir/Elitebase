"use client";

import Image from "next/image";
import { updateCompanySettings } from "@/app/(dashboard)/settings/actions";
import { CurrencySelect } from "@/components/settings/currency-select";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { TimezoneSelect } from "@/components/auth/timezone-select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  dashboardCardClass,
  dashboardFileInputClass,
  dashboardPageIntroClass,
  dashboardSectionTitleClass,
} from "@/lib/dashboard/styles";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto max-w-3xl space-y-6">
      {saved ? (
        <p className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--eb-status-success-fg,#059669)]">
          Settings saved successfully.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage}
        </p>
      ) : null}

      <form action={updateCompanySettings} className="space-y-6">
        <Card className={cn(dashboardCardClass)}>
          <CardHeader>
            <h2 className={dashboardSectionTitleClass}>Company info</h2>
            <p className={dashboardPageIntroClass}>
              Name shown on your dashboard and kiosk experience.
            </p>
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

        <Card className={cn(dashboardCardClass)}>
          <CardHeader>
            <h2 className={dashboardSectionTitleClass}>Appearance</h2>
            <p className={dashboardPageIntroClass}>
              Logo displayed on kiosk idle screens and your admin header.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoUrl ? (
              <div className="flex items-center gap-4">
                <Image
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded-lg border border-[var(--eb-border)] object-contain"
                  unoptimized
                />
                <p className={dashboardPageIntroClass}>
                  Upload a new file to replace the current logo.
                </p>
              </div>
            ) : (
              <p className={dashboardPageIntroClass}>No logo uploaded yet.</p>
            )}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-[var(--eb-text)]"
                htmlFor="logo"
              >
                Company logo
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={dashboardFileInputClass}
              />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(dashboardCardClass)}>
          <CardHeader>
            <h2 className={dashboardSectionTitleClass}>Regional</h2>
            <p className={dashboardPageIntroClass}>
              Timezone and currency used across schedules, timesheets, and pay
              displays.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <TimezoneSelect
              options={[...US_TIMEZONES]}
              defaultValue={selectedTimezone}
            />
            <CurrencySelect defaultValue={selectedCurrency} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <SettingsSubmitButton />
        </div>
      </form>

      <Card className="border-red-500/25 bg-red-500/5">
        <CardHeader>
          <h2 className="text-lg font-medium text-red-400">Danger zone</h2>
          <p className="text-sm text-[var(--eb-muted)]">
            Permanently delete your company and all employee data. This cannot be
            undone.
          </p>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-[10px] border border-red-500/30 bg-[var(--eb-elevated)] px-4 py-2 text-sm font-medium text-red-400/70"
            title="Contact support to delete your company account"
          >
            Delete company (contact support)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
