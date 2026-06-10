import Image from "next/image";
import { updateCompanySettings } from "@/app/(dashboard)/settings/actions";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";

type SettingsFormProps = {
  companyName: string;
  timezone: string | null;
  logoUrl: string | null;
};

export function SettingsForm({
  companyName,
  timezone,
  logoUrl,
}: SettingsFormProps) {
  const selectedTimezone = timezone ?? DEFAULT_TIMEZONE;

  return (
    <form
      action={updateCompanySettings}
      encType="multipart/form-data"
      className="space-y-6"
    >
      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="name">
          Company name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={companyName}
          className="w-full max-w-md rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="timezone">
          Timezone
        </label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={selectedTimezone}
          className="w-full max-w-md rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
        >
          {US_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold" htmlFor="logo">
          Company logo
        </label>
        {logoUrl ? (
          <div className="mb-3 flex items-center gap-4">
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg border border-[#E2E8F0] object-contain"
              unoptimized
            />
            <p className="text-sm text-[#64748B]">
              Upload a new file to replace the current logo.
            </p>
          </div>
        ) : (
          <p className="mb-2 text-sm text-[#64748B]">No logo uploaded yet.</p>
        )}
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full max-w-md rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#DBEAFE] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#1D4ED8]"
        />
      </div>

      <SettingsSubmitButton />
    </form>
  );
}
