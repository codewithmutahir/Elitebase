/** One idempotency key per user action (e.g. kiosk button tap). */
export function createIdempotencyKey(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `kiosk-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
