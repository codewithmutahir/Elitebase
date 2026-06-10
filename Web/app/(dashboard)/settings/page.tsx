import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { settingsErrorMessage } from "@/lib/settings/messages";
import { requireCompanySession } from "@/lib/employees/session";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { company } = await requireCompanySession();
  const params = await searchParams;

  const admin = createClient();
  const { data: fullCompany } = await admin
    .from("companies")
    .select("name, timezone, logo_url")
    .eq("id", company.id)
    .single();

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        Manage your company profile, branding, and preferences.
      </p>

      <SettingsPageContent
        companyName={fullCompany?.name ?? company.name}
        timezone={fullCompany?.timezone ?? company.timezone}
        logoUrl={fullCompany?.logo_url ?? company.logo_url}
        saved={params.saved === "1"}
        errorMessage={settingsErrorMessage(params.error)}
      />
    </div>
  );
}
