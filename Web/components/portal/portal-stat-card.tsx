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
        minWidth: 0,
        overflow: "hidden",
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
          fontSize: { xs: "1.25rem", sm: "1.5rem", lg: "1.65rem" },
          fontWeight: 560,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          color: "text.primary",
          fontVariantNumeric: "tabular-nums",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
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
