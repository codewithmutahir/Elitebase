import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCompanyByOwnerId, type CompanyRow } from "@/lib/company";

export async function requireTimesheetsSession(): Promise<{
  company: CompanyRow;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const company = await getCompanyByOwnerId(session.user.id);

  if (!company) {
    redirect("/onboarding");
  }

  return { company };
}
