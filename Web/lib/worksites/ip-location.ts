import type {
  BrowserLocationFailure,
  BrowserLocationResult,
} from "@/lib/worksites/browser-location";

/** City-level accuracy so UI/geofence treat IP as approximate (buffer capped at 50m). */
export const IP_LOCATION_ACCURACY_M = 5_000;

type IpLookupPayload = {
  lat: number;
  lng: number;
};

async function fetchJson(
  url: string,
  signal: AbortSignal
): Promise<unknown> {
  const res = await fetch(url, {
    method: "GET",
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`IP lookup HTTP ${res.status}`);
  }
  return res.json();
}

function parseBigDataCloud(data: unknown): IpLookupPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as {
    location?: { latitude?: unknown; longitude?: unknown };
    latitude?: unknown;
    longitude?: unknown;
  };
  const lat = Number(row.location?.latitude ?? row.latitude);
  const lng = Number(row.location?.longitude ?? row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseGeoJs(data: unknown): IpLookupPayload | null {
  if (!data || typeof data !== "object") return null;
  const row = data as { latitude?: unknown; longitude?: unknown };
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Approximate location from public IP (city-level).
 * Runs in the browser so localhost still resolves the user's real public IP.
 * Not suitable for tight geofencing — use only when GPS fails and geofence is optional.
 */
export async function requestIpApproximateLocation(): Promise<
  BrowserLocationResult | BrowserLocationFailure
> {
  if (typeof window === "undefined") {
    return { error: "IP location is only available in the browser." };
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8_000);

  try {
    try {
      const data = await fetchJson(
        "https://api.bigdatacloud.net/data/ip-geolocation-full?localityLanguage=en",
        controller.signal
      );
      const parsed = parseBigDataCloud(data);
      if (parsed) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          accuracy: IP_LOCATION_ACCURACY_M,
        };
      }
    } catch {
      // try secondary provider
    }

    const data = await fetchJson(
      "https://get.geojs.io/v1/ip/geo.json",
      controller.signal
    );
    const parsed = parseGeoJs(data);
    if (parsed) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        accuracy: IP_LOCATION_ACCURACY_M,
      };
    }

    return { error: "Could not estimate location from your network." };
  } catch {
    return { error: "Could not estimate location from your network." };
  } finally {
    window.clearTimeout(timer);
  }
}
