const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Accept client-supplied UUID idempotency keys only (reject forged / oversized). */
export function parsePortalIdempotencyKey(
  raw: unknown
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > 64) return null;
  if (!UUID_RE.test(value)) return null;
  return value;
}
