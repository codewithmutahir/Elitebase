import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
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
];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const kioskRoute = getKioskRouteName(pathname);
  if (kioskRoute) {
    const rateLimit = await checkKioskRateLimit(request, kioskRoute);
    if (rateLimit.limited) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      });
    }
  }

  const sessionCookie = getSessionCookie(request);

  if (matchesRoute(pathname, protectedRoutes) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/kiosk/:path*",
    "/dashboard/:path*",
    "/employees/:path*",
    "/timesheets/:path*",
    "/kiosk-setup/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/super-admin/:path*",
    "/schedule/:path*",
    "/team/:path*",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/register/:path*",
    "/privacy-policy",
    "/",
  ],
};
