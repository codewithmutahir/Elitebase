export const COOKIE_CONSENT_STORAGE_KEY = "elitebase-cookie-consent";
export const COOKIE_CONSENT_COOKIE_NAME = "elitebase_cookie_consent";
export const COOKIE_CONSENT_CHANGED_EVENT = "elitebase:cookie-consent";

export type CookieConsentValue = "accepted" | "rejected";

export function isCookieConsentValue(
  value: unknown
): value is CookieConsentValue {
  return value === "accepted" || value === "rejected";
}

export function getStoredCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return isCookieConsentValue(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(
  consent: CookieConsentValue | null = getStoredCookieConsent()
): boolean {
  return consent === "accepted";
}

function persistConsentCookie(value: CookieConsentValue) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function setCookieConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  } catch {
    // Ignore quota / private mode failures; cookie still helps SSR-ish reads.
  }
  persistConsentCookie(value);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: value })
  );
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("elitebase:open-cookie-settings"));
}
