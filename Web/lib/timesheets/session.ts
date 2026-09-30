import { cache } from "react";
import { requireCompanySession, type CompanySession } from "@/lib/employees/session";
import type { CompanyRow } from "@/lib/company";

export const requireTimesheetsSession = cache(async (): Promise<{
  company: CompanyRow;
}> => {
  const { company }: CompanySession = await requireCompanySession();
  return { company };
});
