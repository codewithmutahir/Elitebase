import Link from "next/link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LocationsSettings } from "@/components/settings/locations-settings";
import { requireCompanySession } from "@/lib/employees/session";
import { dashboardPageIntroSx } from "@/lib/dashboard/sx";
import { listWorksites } from "@/lib/worksites/queries";

export default async function SettingsLocationsPage() {
  const { company } = await requireCompanySession();
  const worksites = await listWorksites(company.id);

  return (
    <Stack spacing={3}>
      <div>
        <Link
          href="/settings"
          className="inline-block text-sm text-[var(--eb-muted)] no-underline hover:text-[var(--eb-accent)]"
        >
          ← Settings
        </Link>
        <Typography sx={{ ...dashboardPageIntroSx, mt: 1 }}>
          Worksite pins for portal geofence and remote punch controls.
        </Typography>
      </div>

      <LocationsSettings
        allowRemotePunch={company.allow_remote_punch}
        requireGeofence={company.require_geofence}
        worksites={worksites}
      />
    </Stack>
  );
}
