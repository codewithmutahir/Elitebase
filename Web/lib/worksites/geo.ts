/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type WorksiteGeo = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_meters: number;
};

export type GeofenceMatch = {
  worksite: WorksiteGeo;
  distance_m: number;
  within: boolean;
};

/** Nearest worksite; `within` if distance ≤ radius (+ optional GPS accuracy buffer). */
export function matchGeofence(
  lat: number,
  lng: number,
  sites: WorksiteGeo[],
  accuracyM = 0
): GeofenceMatch | null {
  if (sites.length === 0) return null;

  let best: GeofenceMatch | null = null;
  for (const site of sites) {
    const distance_m = distanceMeters(lat, lng, site.lat, site.lng);
    const within = distance_m <= site.radius_meters + Math.min(accuracyM, 50);
    const candidate = { worksite: site, distance_m, within };
    if (!best || distance_m < best.distance_m) {
      best = candidate;
    }
  }
  return best;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Parse pasted Google Maps-style coords, e.g.
 * "40.712800, -74.006000" or "40.712800 -74.006000"
 */
export function parseLatLngPaste(
  raw: string
): { lat: number; lng: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/
  );
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}
