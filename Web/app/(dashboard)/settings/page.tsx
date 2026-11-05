import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { settingsErrorMessage } from "@/lib/settings/messages";
import { requireCompanySession } from "@/lib/employees/session";
import { dashboardPageIntroSx } from "@/lib/dashboard/sx";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { company } = await requireCompanySession();
  const params = await searchParams;

  return (
    <Stack spacing={4}>
      <Typography sx={dashboardPageIntroSx}>
        Manage your company profile, branding, and preferences.
      </Typography>

      <SettingsPageContent
        companyName={company.name}
        timezone={company.timezone}
        currency={company.currency}
        logoUrl={company.logo_url}
        leaveSickTotalDefault={company.leave_sick_total_default}
        leavePaidTotalDefault={company.leave_paid_total_default}
        leaveYearType={company.leave_year_type}
        leaveProrateMidYear={company.leave_prorate_mid_year}
        lateGraceMinutes={company.late_grace_minutes}
        latesPerDayDeduction={company.lates_per_day_deduction}
        lateRemainderCarryMonth={company.late_remainder_carry_month}
        saved={params.saved === "1"}
        errorMessage={settingsErrorMessage(params.error)}
      />
    </Stack>
  );
}
