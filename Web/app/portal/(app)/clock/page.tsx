import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PortalClockView } from "@/components/portal/portal-clock-view";
import { getPortalClockStatus } from "@/lib/portal/clock";
import { requireEmployeeSession } from "@/lib/portal/session";

export default async function PortalClockPage() {
  const { employee } = await requireEmployeeSession();
  const status = await getPortalClockStatus(employee);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-aeonik), var(--font-satoshi), sans-serif",
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            fontWeight: 560,
            letterSpacing: "-0.03em",
            color: "var(--eb-text)",
          }}
        >
          Clock in / out
        </Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary", maxWidth: 520 }}>
          Flow: enroll face → allow location → clock in (we verify your face on
          each punch). Location is checked only when you punch — not tracked
          continuously.
        </Typography>
      </Box>

      <PortalClockView status={status} />
    </Stack>
  );
}
