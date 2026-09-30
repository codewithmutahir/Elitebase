import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { settingsErrorMessage } from "@/lib/settings/messages";
import { requireCompanySession } from "@/lib/employees/session";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { company } = await requireCompanySession();
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        Manage your company profile, branding, and preferences.
      </p>

      <SettingsPageContent
        companyName={company.name}
        timezone={company.timezone}
        currency={company.currency}
        logoUrl={company.logo_url}
        saved={params.saved === "1"}
        errorMessage={settingsErrorMessage(params.error)}
      />
    </div>
  );
}
