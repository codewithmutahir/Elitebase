import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Employee portal action limits (per employee id).
 * Fail-open when Redis is missing so clock-in is not blocked by Upstash outages
 * (same posture as kiosk limits). Production auth remains fail-closed elsewhere.
 */
const PORTAL_LIMITS = {
  "clock-punch": { requests: 20, window: "15 m" as const },
  "face-enroll": { requests: 8, window: "1 h" as const },
  "leave-create": { requests: 10, window: "1 h" as const },
  "leave-cancel": { requests: 20, window: "1 h" as const },
} as const;

export type PortalRateLimitBucket = keyof typeof PORTAL_LIMITS;

const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return Redis.fromEnv();
}

function getLimiter(bucket: PortalRateLimitBucket): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cached = limiterCache.get(bucket);
  if (cached) return cached;

  const config = PORTAL_LIMITS[bucket];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `portal:${bucket}`,
    analytics: true,
  });
  limiterCache.set(bucket, limiter);
  return limiter;
}

export type PortalRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

export async function checkPortalRateLimit(
  bucket: PortalRateLimitBucket,
  employeeId: string
): Promise<PortalRateLimitResult> {
  const limiter = getLimiter(bucket);
  if (!limiter) {
    return { limited: false };
  }

  try {
    const { success, reset } = await limiter.limit(employeeId);
    if (success) return { limited: false };
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    console.error(
      `[portal rate-limit] ${bucket} unavailable:`,
      error instanceof Error ? error.message : error
    );
    return { limited: false };
  }
}

export function portalRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}
