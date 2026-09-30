import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** One Better Auth session read per React server request. */
export const getAuthSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
