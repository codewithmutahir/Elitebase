"use client";

import Image from "next/image";
import { updateCompanySettings } from "@/app/(dashboard)/settings/actions";
import { CurrencySelect } from "@/components/settings/currency-select";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { TimezoneSelect } from "@/components/auth/timezone-select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <div className="mx-auto max-w-3xl space-y-6">
      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Settings saved successfully.
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <form action={updateCompanySettings} encType="multipart/form-data" className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Company info</h2>
            <p className="text-sm text-slate-500">
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

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
            <p className="text-sm text-slate-500">
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
                  className="h-16 w-16 rounded-lg border border-slate-200 object-contain"
                  unoptimized
                />
                <p className="text-sm text-slate-500">
                  Upload a new file to replace the current logo.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No logo uploaded yet.</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="logo">
                Company logo
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">Regional</h2>
            <p className="text-sm text-slate-500">
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

      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <h2 className="text-lg font-semibold text-red-800">Danger zone</h2>
          <p className="text-sm text-red-700/80">
            Permanently delete your company and all employee data. This cannot be
            undone.
          </p>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-400"
            title="Contact support to delete your company account"
          >
            Delete company (contact support)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
