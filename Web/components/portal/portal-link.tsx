"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

/** Safe Link + MUI `sx` for use from Server Components (avoids passing Link as a prop). */
export function PortalLink({
  href,
  children,
  sx,
  className,
}: {
  href: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
  className?: string;
}) {
  return (
    <Box component={Link} href={href} className={className} sx={sx}>
      {children}
    </Box>
  );
}
