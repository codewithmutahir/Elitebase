import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server-session";
import { getCompanyByOwnerId, type CompanyRow } from "@/lib/company";

export type CompanySessionUser = {
  id: string;
  name: string;
  email: string;
};

export type CompanySession = {
  userId: string;
  user: CompanySessionUser;
  company: CompanyRow;
};

/** Auth + company lookup once per server request; redirects when unauthenticated. */
export const requireCompanySession = cache(async (): Promise<CompanySession> => {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const company = await getCompanyByOwnerId(session.user.id);

  if (!company) {
    redirect("/onboarding");
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email,
    },
    company,
  };
});
