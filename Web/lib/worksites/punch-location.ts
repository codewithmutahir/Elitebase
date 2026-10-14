import {
  requestBrowserLocation,
  type BrowserLocationFailure,
  type BrowserLocationResult,
} from "@/lib/worksites/browser-location";
import { requestIpApproximateLocation } from "@/lib/worksites/ip-location";

export type PunchLocationSource = "gps" | "ip";

export type PunchLocationSuccess = BrowserLocationResult & {
  source: PunchLocationSource;
};

export type PunchLocationResult =
  | PunchLocationSuccess
  | (BrowserLocationFailure & { source?: undefined })
  | { skipped: true };

export type ResolvePunchLocationOptions = {
  /** When true, IP fallback is not used — GPS is required. */
  requireGeofence: boolean;
  mode?: "full" | "quick";
};

/**
 * GPS first; if geofence is optional and GPS fails, fall back to IP approx.
 * Returns `{ skipped: true }` only when optional geofence and both GPS + IP fail.
 */
export async function resolvePunchLocation(
  options: ResolvePunchLocationOptions
): Promise<PunchLocationResult> {
  const mode = options.mode ?? (options.requireGeofence ? "full" : "quick");

  const gps = await requestBrowserLocation({ mode });
  if (!("error" in gps)) {
    return { ...gps, source: "gps" };
  }

  if (options.requireGeofence) {
    return gps;
  }

  const ip = await requestIpApproximateLocation();
  if (!("error" in ip)) {
    return { ...ip, source: "ip" };
  }

  return { skipped: true };
}
