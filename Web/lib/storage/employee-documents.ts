import type { SupabaseClient } from "@supabase/supabase-js";

export const EMPLOYEE_DOCUMENTS_BUCKET = "employee-documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/** Extract storage object path from a legacy public URL, if present. */
export function storagePathFromPublicUrl(fileUrl: string | null | undefined) {
  if (!fileUrl) return null;
  const marker = `/object/public/${EMPLOYEE_DOCUMENTS_BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(fileUrl.slice(idx + marker.length).split("?")[0] ?? "");
  } catch {
    return null;
  }
}

export async function createEmployeeDocumentSignedUrl(
  admin: SupabaseClient,
  filePath: string | null | undefined,
  legacyFileUrl?: string | null
): Promise<string | null> {
  const path =
    (filePath && filePath.trim()) ||
    storagePathFromPublicUrl(legacyFileUrl) ||
    null;
  if (!path) return null;

  const { data, error } = await admin.storage
    .from(EMPLOYEE_DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("createEmployeeDocumentSignedUrl:", error?.message);
    return null;
  }
  return data.signedUrl;
}
