/** Current public REST version (URL prefix `/api/v1`). */
export const CURRENT_API_VERSION = "v1" as const;

export const API_V1_BASE = `/api/${CURRENT_API_VERSION}` as const;

/** Operational routes (Vercel Cron, internal keys) — not part of the public versioned surface. */
export const API_INTERNAL_PREFIX = "/api/cron" as const;

export function apiV1Path(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, "");
  return `${API_V1_BASE}/${trimmed}`;
}
