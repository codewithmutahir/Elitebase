import type { SupabaseClient } from "@supabase/supabase-js";

export const LOGO_BUCKET = "company-logos";
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type LogoUploadResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadCompanyLogo(
  admin: SupabaseClient,
  companyId: string,
  logo: File
): Promise<LogoUploadResult> {
  if (logo.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "logo_too_large" };
  }

  if (!ALLOWED_LOGO_TYPES.has(logo.type)) {
    return { ok: false, error: "logo_invalid_type" };
  }

  const extension = logo.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["jpeg", "jpg", "png", "webp", "gif"].includes(extension)
    ? extension === "jpeg"
      ? "jpg"
      : extension
    : "png";
  const objectPath = `${companyId}/logo-${Date.now()}.${safeExt}`;
  const buffer = Buffer.from(await logo.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(objectPath, buffer, {
      contentType: logo.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("uploadCompanyLogo failed:", uploadError.message);
    return { ok: false, error: "logo_upload_failed" };
  }

  const { data: publicUrl } = admin.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(objectPath);

  return { ok: true, publicUrl: publicUrl.publicUrl };
}
