import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { portalPanelSx } from "@/lib/portal/styles";

export function PortalEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        ...portalPanelSx,
        px: 3,
        py: { xs: 5, sm: 6 },
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontWeight: 560,
          fontSize: "1.05rem",
          color: "text.primary",
        }}
      >
        {title}
      </Typography>
      {description ? (
        <Typography
          sx={{
            mt: 1,
            mx: "auto",
            maxWidth: 420,
            color: "text.secondary",
            fontSize: "0.9375rem",
            lineHeight: 1.55,
          }}
        >
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 2.5 }}>{action}</Box> : null}
    </Box>
  );
}
