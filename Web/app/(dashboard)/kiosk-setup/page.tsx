import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GenerateSetupPanel } from "@/components/kiosk/generate-setup-panel";
import { TabletList } from "@/components/kiosk/tablet-list";
import { requireCompanySession } from "@/lib/employees/session";
import { listKioskTablets } from "@/lib/kiosk/queries";
import { dashboardPageIntroSx, dashboardSectionTitleSx } from "@/lib/dashboard/sx";

export default async function KioskSetupPage() {
  const { company } = await requireCompanySession();
  const tablets = await listKioskTablets(company.id);

  return (
    <Stack spacing={4}>
      <Typography sx={dashboardPageIntroSx}>
        Pair tablets with your company so employees can clock in on-site.
      </Typography>

      <GenerateSetupPanel />

      <Stack component="section" spacing={2}>
        <Typography component="h2" sx={dashboardSectionTitleSx}>
          Registered tablets
        </Typography>
        <TabletList tablets={tablets} />
      </Stack>
    </Stack>
  );
}
