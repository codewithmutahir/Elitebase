import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

/**
 * Limits are per tablet token (one shared kiosk device).
 * Night shift (~9pm) queues many employees on the same tablet — keep verify /
 * warmup high enough that rate-limit is not the clock-in bottleneck.
 */
const KIOSK_ROUTE_LIMITS: Record<string, { requests: number; window: "1 m" }> = {
  "get-employee": { requests: 60, window: "1 m" },
  "verify-face": { requests: 120, window: "1 m" },
  "register-face": { requests: 20, window: "1 m" },
  "clock-action": { requests: 60, window: "1 m" },
  "employee-status": { requests: 60, window: "1 m" },
  "validate-tablet": { requests: 30, window: "1 m" },
  "register-tablet": { requests: 10, window: "1 m" },
  "leave-request": { requests: 30, window: "1 m" },
  "face-verify-log": { requests: 120, window: "1 m" },
  "face-warmup": { requests: 60, window: "1 m" },
};

/** Routes that must fail closed in production when Redis is unavailable. */
const FAIL_CLOSED_IN_PRODUCTION = new Set(["register-tablet"]);

const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return Redis.fromEnv();
}

function getLimiter(route: string): Ratelimit | null {
  const config = KIOSK_ROUTE_LIMITS[route];
  if (!config) return null;

  const redis = getRedis();
  if (!redis) return null;

  const cached = limiterCache.get(route);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `kiosk:${route}`,
    analytics: true,
  });
  limiterCache.set(route, limiter);
  return limiter;
}

export { parseKioskRouteSegment as getKioskRouteName } from "@/lib/api/paths";

function getRateLimitIdentifier(request: NextRequest, route: string): string {
  const tabletToken =
    request.headers.get("x-tablet-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (tabletToken) return tabletToken;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
  return `${route}:${ip}`;
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

export async function checkKioskRateLimit(
  request: NextRequest,
  route: string
): Promise<RateLimitResult> {
  const failClosed =
    FAIL_CLOSED_IN_PRODUCTION.has(route) &&
    process.env.NODE_ENV === "production";

  try {
    const limiter = getLimiter(route);
    if (!limiter) {
      if (failClosed) {
        return { limited: true, retryAfterSeconds: 900 };
      }
      return { limited: false };
    }

    const identifier = getRateLimitIdentifier(request, route);
    const { success, reset } = await limiter.limit(identifier);

    if (success) return { limited: false };

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((reset - Date.now()) / 1000)
    );
    return { limited: true, retryAfterSeconds };
  } catch (error) {
    console.error(`[kiosk rate-limit] ${route} unavailable:`, error);
    if (failClosed) {
      return { limited: true, retryAfterSeconds: 900 };
    }
    // Do not block day-to-day kiosk clock-in if Upstash is unreachable.
    return { limited: false };
  }
}
