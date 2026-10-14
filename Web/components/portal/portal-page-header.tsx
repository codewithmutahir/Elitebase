import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { portalPageSubtitleSx, portalPageTitleSx } from "@/lib/portal/styles";

export function PortalPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", sm: "flex-start" },
        justifyContent: "space-between",
        minWidth: 0,
        width: "100%",
      }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
        <Typography component="h1" sx={portalPageTitleSx}>
          {title}
        </Typography>
        {description ? (
          <Typography sx={portalPageSubtitleSx}>{description}</Typography>
        ) : null}
      </Box>
      {action ? (
        <Box sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "flex-start" } }}>
          {action}
        </Box>
      ) : null}
    </Stack>
  );
}
