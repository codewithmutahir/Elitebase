"use client";

import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { updateCompanySettings } from "@/app/(dashboard)/settings/actions";
import { SettingsSubmitButton } from "@/components/settings/settings-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { dashboardFileInputSx } from "@/lib/dashboard/sx";
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
    <Box
      component="form"
      action={updateCompanySettings}
      encType="multipart/form-data"
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Box sx={{ maxWidth: 448 }}>
        <Input
          id="name"
          name="name"
          label="Company name"
          required
          defaultValue={companyName}
        />
      </Box>

      <Select
        id="timezone"
        name="timezone"
        label="Timezone"
        defaultValue={selectedTimezone}
        displayEmpty={false}
        options={US_TIMEZONES.map((tz) => ({
          value: tz.value,
          label: tz.label,
        }))}
        sx={{ maxWidth: 448 }}
      />

      <Stack spacing={1.5}>
        <FormLabel htmlFor="logo" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Company logo
        </FormLabel>
        {logoUrl ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Image
              src={logoUrl}
              alt={`${companyName} logo`}
              width={64}
              height={64}
              style={{
                height: 64,
                width: 64,
                borderRadius: 8,
                border: "1px solid",
                borderColor: "divider",
                objectFit: "contain",
              }}
              unoptimized
            />
            <Typography variant="body2" color="text.secondary">
              Upload a new file to replace the current logo.
            </Typography>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No logo uploaded yet.
          </Typography>
        )}
        <Box
          component="input"
          id="logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          sx={dashboardFileInputSx}
        />
      </Stack>

      <SettingsSubmitButton />
    </Box>
  );
}
