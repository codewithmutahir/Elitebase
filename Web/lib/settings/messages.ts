const ERROR_MESSAGES: Record<string, string> = {
  missing_name: "Company name is required.",
  logo_too_large: "Logo must be 2 MB or smaller.",
  logo_invalid_type: "Logo must be JPEG, PNG, WebP, or GIF.",
  logo_upload_failed:
    "Logo upload failed. Check the company-logos bucket in Supabase.",
  save_failed: "Could not save settings. Please try again.",
};

export function settingsErrorMessage(code: string | undefined) {
  if (!code) return null;
  return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}
