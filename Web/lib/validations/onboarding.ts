import { z } from "zod";
import { DEFAULT_TIMEZONE, US_TIMEZONES } from "@/lib/timezones";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const timezoneValues = US_TIMEZONES.map((tz) => tz.value) as [
  string,
  ...string[],
];

export const onboardingSchema = z
  .object({
    timezone: z.enum(timezoneValues, {
      message: "Choose a valid timezone",
    }),
    logo: z.instanceof(File).optional(),
  })
  .superRefine((data, ctx) => {
    const logo = data.logo;
    if (!logo || logo.size === 0) return;

    if (logo.size > MAX_LOGO_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Logo must be 2 MB or smaller",
        path: ["logo"],
      });
    }

    if (!ALLOWED_LOGO_TYPES.has(logo.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Logo must be JPEG, PNG, WebP, or GIF",
        path: ["logo"],
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function parseOnboardingFormData(formData: FormData) {
  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  const logoEntry = formData.get("logo");
  const logo =
    logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : undefined;

  const timezone = timezoneValues.includes(timezoneRaw)
    ? timezoneRaw
    : DEFAULT_TIMEZONE;

  return onboardingSchema.safeParse({ timezone, logo });
}
