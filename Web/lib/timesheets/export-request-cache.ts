/**
 * Deduplicate concurrent identical timesheet export builds and briefly reuse
 * the result so double-clicks / retries do not hit the DB repeatedly.
 */
type ExportPayload = { csv: string; filename: string };

type CacheEntry = ExportPayload & { expiresAt: number };

const CACHE_TTL_MS = 8_000;

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<ExportPayload>>();

export function timesheetExportCacheKey(parts: {
  companyId: string;
  from: string;
  to: string;
  employeeId?: string;
  format: string;
  currency: string | null | undefined;
}): string {
  return [
    parts.companyId,
    parts.from,
    parts.to,
    parts.employeeId ?? "all",
    parts.format,
    parts.currency ?? "",
  ].join("|");
}

export async function getCachedTimesheetExport(
  key: string,
  build: () => Promise<ExportPayload>
): Promise<ExportPayload> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return { csv: hit.csv, filename: hit.filename };
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = build()
    .then((payload) => {
      cache.set(key, { ...payload, expiresAt: Date.now() + CACHE_TTL_MS });
      inflight.delete(key);
      return payload;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });

  inflight.set(key, promise);
  return promise;
}
