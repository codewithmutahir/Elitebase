import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const KIOSK_ROUTE_LIMITS: Record<string, { requests: number; window: "1 m" }> = {
  "get-employee": { requests: 10, window: "1 m" },
  "verify-face": { requests: 5, window: "1 m" },
  "register-face": { requests: 3, window: "1 m" },
  "clock-action": { requests: 20, window: "1 m" },
  "employee-status": { requests: 20, window: "1 m" },
  "validate-tablet": { requests: 10, window: "1 m" },
  "register-tablet": { requests: 5, window: "1 m" },
};

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

export function getKioskRouteName(pathname: string): string | null {
  const match = pathname.match(/^\/api\/kiosk\/([^/]+)$/);
  return match?.[1] ?? null;
}

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
  const limiter = getLimiter(route);
  if (!limiter) return { limited: false };

  const identifier = getRateLimitIdentifier(request, route);
  const { success, reset } = await limiter.limit(identifier);

  if (success) return { limited: false };

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((reset - Date.now()) / 1000)
  );
  return { limited: true, retryAfterSeconds };
}
