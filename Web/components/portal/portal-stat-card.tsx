import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { portalPanelSx } from "@/lib/portal/styles";

export function PortalStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        ...portalPanelSx,
        px: 2.25,
        py: 2,
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
          fontWeight: 560,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
      {hint ? (
        <Typography sx={{ mt: 0.5, fontSize: "0.8rem", color: "text.secondary" }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}
