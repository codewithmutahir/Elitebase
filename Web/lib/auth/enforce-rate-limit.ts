import { redirect } from "next/navigation";

import {

  checkAuthRateLimitForAction,

  type AuthRateLimitBucket,

  type RateLimitResult,

} from "@/lib/auth/rate-limit";



export function authRateLimitErrorCode(

  result: Extract<RateLimitResult, { limited: true }>

): "rate_limited" | "rate_limit_unavailable" {

  return result.reason === "unavailable"

    ? "rate_limit_unavailable"

    : "rate_limited";

}



/** Call at the start of auth server actions; redirects with a rate-limit error query. */

export async function enforceAuthRateLimitInAction(

  bucket: AuthRateLimitBucket,

  redirectPath: string

): Promise<void> {

  const result = await checkAuthRateLimitForAction(bucket);

  if (result.limited) {

    redirect(`${redirectPath}?error=${authRateLimitErrorCode(result)}`);

  }

}



export const AUTH_RATE_LIMIT_MESSAGE =

  "Too many attempts from your network. Please wait about 15 minutes and try again.";



export const AUTH_RATE_LIMIT_UNAVAILABLE_MESSAGE =

  "Sign-in and registration are temporarily unavailable. Please try again in a few minutes.";



export function resolveAuthRateLimitQueryMessage(

  error?: string | null

): string | null {

  if (error === "rate_limited") return AUTH_RATE_LIMIT_MESSAGE;

  if (error === "rate_limit_unavailable") {

    return AUTH_RATE_LIMIT_UNAVAILABLE_MESSAGE;

  }

  return null;

}

