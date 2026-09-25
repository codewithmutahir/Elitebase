import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

/** Per IP — aligned with client-side 5-attempt lockout windows. */
export const AUTH_RATE_LIMITS = {
  login: { requests: 5, window: "15 m" as const },
  "register-employer": { requests: 5, window: "15 m" as const },
  "forgot-password": { requests: 5, window: "15 m" as const },
  "reset-password": { requests: 5, window: "15 m" as const },
  onboarding: { requests: 10, window: "15 m" as const },
  "auth-api": { requests: 30, window: "1 m" as const },
} satisfies Record<string, { requests: number; window: "1 m" | "15 m" }>;

export type AuthRateLimitBucket = keyof typeof AUTH_RATE_LIMITS;

const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return Redis.fromEnv();
}

function getLimiter(bucket: AuthRateLimitBucket): Ratelimit | null {
  const config = AUTH_RATE_LIMITS[bucket];
  const redis = getRedis();
  if (!redis) return null;

  const cached = limiterCache.get(bucket);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `auth:${bucket}`,
    analytics: true,
  });
  limiterCache.set(bucket, limiter);
  return limiter;
}

export function getClientIpFromForwarded(forwarded: string | null): string {
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

export async function getRequestClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const realIp = h.get("x-real-ip");
  if (forwarded) return getClientIpFromForwarded(forwarded);
  if (realIp?.trim()) return realIp.trim();
  return "anonymous";
}

function getIpFromNextRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return getClientIpFromForwarded(forwarded);
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "anonymous";
}

export type RateLimitResult =
  | { limited: false }
  | {
      limited: true;
      retryAfterSeconds: number;
      reason: "quota" | "unavailable";
    };

const PRODUCTION_FAIL_CLOSED_RETRY_SECONDS = 15 * 60;

export function isAuthRateLimitStrictInProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isProductionEnv(): boolean {
  return isAuthRateLimitStrictInProduction();
}

function authRateLimitUnavailable(): RateLimitResult {
  return {
    limited: true,
    retryAfterSeconds: PRODUCTION_FAIL_CLOSED_RETRY_SECONDS,
    reason: "unavailable",
  };
}

export async function checkAuthRateLimit(
  bucket: AuthRateLimitBucket,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const limiter = getLimiter(bucket);
    if (!limiter) {
      if (isProductionEnv()) {
        console.error(
          `[auth rate-limit] ${bucket}: Upstash not configured — blocking (production fail-closed)`
        );
        return authRateLimitUnavailable();
      }
      return { limited: false };
    }

    const { success, reset } = await limiter.limit(identifier);

    if (success) return { limited: false };

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((reset - Date.now()) / 1000)
    );
    return { limited: true, retryAfterSeconds, reason: "quota" };
  } catch (error) {
    console.error(`[auth rate-limit] ${bucket} unavailable:`, error);
    if (isProductionEnv()) {
      return authRateLimitUnavailable();
    }
    return { limited: false };
  }
}

export async function checkAuthRateLimitForRequest(
  request: NextRequest,
  bucket: AuthRateLimitBucket
): Promise<RateLimitResult> {
  const ip = getIpFromNextRequest(request);
  return checkAuthRateLimit(bucket, ip);
}

export async function checkAuthRateLimitForAction(
  bucket: AuthRateLimitBucket
): Promise<RateLimitResult> {
  const ip = await getRequestClientIp();
  return checkAuthRateLimit(bucket, ip);
}

export function getAuthRateLimitBucketForPath(
  pathname: string
): AuthRateLimitBucket | null {
  if (pathname.startsWith("/api/auth")) return "auth-api";
  return null;
}
