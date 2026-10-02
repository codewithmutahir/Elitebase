import { DashboardPageView } from "@/components/dashboard/dashboard-page-view";
import { getDashboardData } from "@/lib/dashboard/data";
import { companyTimezone } from "@/lib/dashboard/format";
import { requireCompanySession } from "@/lib/employees/session";

export default async function DashboardPage() {
  const { company } = await requireCompanySession();
  const timezone = companyTimezone(company.timezone);
  const data = await getDashboardData(company.id, timezone);
  const tzLabel = timezone.replace(/_/g, " ");

  return (
    <DashboardPageView
      companyName={company.name}
      timezone={timezone}
      tzLabel={tzLabel}
      data={data}
    />
  );
}
