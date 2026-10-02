import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SuperAdminCompaniesTable } from "@/components/super-admin/companies-table";
import { listAllCompaniesForSuperAdmin } from "@/lib/super-admin/companies";
import { requireSuperAdminSession } from "@/lib/super-admin/session";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
} from "@/lib/dashboard/sx";

export default async function SuperAdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; suspended?: string }>;
}) {
  const [params, companies] = await Promise.all([
    searchParams,
    (async () => {
      await requireSuperAdminSession();
      return listAllCompaniesForSuperAdmin();
    })(),
  ]);

  const errorMessage =
    params.error === "suspend_failed"
      ? "Could not suspend company. Please try again."
      : params.error
        ? "Something went wrong."
        : null;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" sx={{ fontSize: "1.875rem", fontWeight: 700 }}>
          All companies
        </Typography>
        <Typography sx={{ mt: 1, color: "text.secondary" }}>
          Platform-wide company list. Suspending blocks the company account from
          active use.
        </Typography>
      </Box>

      {params.suspended === "1" ? (
        <Typography component="p" sx={dashboardAlertSuccessSx}>
          Company suspended.
        </Typography>
      ) : null}

      {errorMessage ? (
        <Typography component="p" sx={dashboardAlertErrorSx}>
          {errorMessage}
        </Typography>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: 1,
        }}
      >
        <SuperAdminCompaniesTable companies={companies} />
      </Paper>
    </Stack>
  );
}
