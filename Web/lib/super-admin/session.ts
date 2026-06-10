import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/super-admin/access";

export async function requireSuperAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  return session;
}
