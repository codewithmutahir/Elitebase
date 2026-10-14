export type BrowserLocationResult = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

export type BrowserLocationFailure = {
  error: string;
  code?: number;
};

export type RequestBrowserLocationOptions = {
  /**
   * Shorter deadlines for best-effort punches (geofence optional).
   * Full timeouts when a GPS fix is required.
   */
  mode?: "full" | "quick";
};

function isGeoError(value: unknown): value is GeolocationPositionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as GeolocationPositionError).code === "number"
  );
}

/** Clear employee-facing copy keyed off GeolocationPositionError.code */
function geoErrorMessage(code: number): string {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return "Location permission is blocked. Allow location for this site (lock icon → Site settings → Location → Allow), then try again.";
    case 2: // POSITION_UNAVAILABLE
      return "GPS / location is unavailable on this device. Turn on Location services, then try again.";
    case 3: // TIMEOUT
      return "Location timed out. Desktop Wi‑Fi fixes are slow indoors — try again, or clock in from a phone with GPS.";
    default:
      return "Could not read your location. Try again.";
  }
}

function toResult(pos: GeolocationPosition): BrowserLocationResult {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy ?? null,
  };
}

function getCurrentPosition(
  options: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * High accuracy first (OS / GPS), then low accuracy retry (network / Wi‑Fi).
 * code 1 = deny, 2 = unavailable, 3 = timeout
 */
async function getLocation(
  mode: "full" | "quick"
): Promise<GeolocationPosition> {
  const highTimeout = mode === "quick" ? 6_000 : 10_000;
  const lowTimeout = mode === "quick" ? 8_000 : 20_000;

  try {
    return await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: highTimeout,
      maximumAge: mode === "quick" ? 60_000 : 0,
    });
  } catch (first) {
    if (isGeoError(first) && first.code === 1) {
      throw first;
    }
    return getCurrentPosition({
      enableHighAccuracy: false,
      timeout: lowTimeout,
      maximumAge: 60_000,
    });
  }
}

let inflightRequest: Promise<
  BrowserLocationResult | BrowserLocationFailure
> | null = null;
let inflightMode: "full" | "quick" | null = null;

async function requestBrowserLocationUnqueued(
  mode: "full" | "quick"
): Promise<BrowserLocationResult | BrowserLocationFailure> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { error: "Geolocation is not available in this browser." };
  }

  if (
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return {
      error:
        "Location needs HTTPS (or localhost). Open the app on a secure URL.",
    };
  }

  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });
      if (status.state === "denied") {
        return { error: geoErrorMessage(1), code: 1 };
      }
    }
  } catch {
    // permissions.query is optional
  }

  try {
    return toResult(await getLocation(mode));
  } catch (err) {
    const code = isGeoError(err) ? err.code : 3;
    return { error: geoErrorMessage(code), code };
  }
}

/**
 * One-shot location for portal punch / worksite setup.
 * Concurrent callers with the same mode share one in-flight request.
 */
export function requestBrowserLocation(
  options?: RequestBrowserLocationOptions
): Promise<BrowserLocationResult | BrowserLocationFailure> {
  const mode = options?.mode ?? "full";
  if (inflightRequest && inflightMode === mode) return inflightRequest;
  inflightMode = mode;
  inflightRequest = requestBrowserLocationUnqueued(mode).finally(() => {
    inflightRequest = null;
    inflightMode = null;
  });
  return inflightRequest;
}
