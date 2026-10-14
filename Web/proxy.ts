import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  checkAuthRateLimitForRequest,
  getAuthRateLimitBucketForPath,
  isAuthRateLimitStrictInProduction,
} from "@/lib/auth/rate-limit";
import {
  checkKioskRateLimit,
  getKioskRouteName,
} from "@/lib/kiosk/rate-limit";

const protectedRoutes = [
  "/dashboard",
  "/employees",
  "/timesheets",
  "/kiosk-setup",
  "/settings",
  "/onboarding",
  "/super-admin",
  "/schedule",
  "/team",
  "/portal",
];

/** Public under /portal — must not require a session cookie. */
const portalPublicRoutes = ["/portal/accept-invite"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST") {
    const authBucket = getAuthRateLimitBucketForPath(pathname);
    if (authBucket) {
      try {
        const rateLimit = await checkAuthRateLimitForRequest(request, authBucket);
        if (rateLimit.limited) {
          return new NextResponse("Too Many Requests", {
            status:429,
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          });
        }
      } catch (error) {
        console.error("[proxy] auth rate limit failed:", error);
        if (isAuthRateLimitStrictInProduction()) {
          return new NextResponse("Service Unavailable", {
            status: 503,
            headers: { "Retry-After": "900" },
          });
        }
      }
    }
  }

  const kioskRoute = getKioskRouteName(pathname);
  if (kioskRoute) {
    try {
      const rateLimit = await checkKioskRateLimit(request, kioskRoute);
      if (rateLimit.limited) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        });
      }
    } catch (error) {
      console.error("[proxy] kiosk rate limit failed:", error);
    }

    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  // Only gate protected routes — do NOT redirect /login → /dashboard based on
  // cookie presence alone. A stale or invalid cookie causes an infinite loop
  // when the dashboard layout cannot validate the session server-side.
  const isPortalPublic = matchesRoute(pathname, portalPublicRoutes);
  if (
    matchesRoute(pathname, protectedRoutes) &&
    !isPortalPublic &&
    !sessionCookie
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/kiosk/:path*",
    "/api/v1/kiosk/:path*",
    "/api/v1/timesheets/:path*",
    "/dashboard/:path*",
    "/employees/:path*",
    "/timesheets/:path*",
    "/kiosk-setup/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/super-admin/:path*",
    "/schedule/:path*",
    "/team/:path*",
    "/portal",
    "/portal/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/register/:path*",
    "/privacy-policy",
    "/terms-of-service",
    "/cookie-policy",
    "/",
  ],
};
