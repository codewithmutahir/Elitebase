"use client";

import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

type AuthFooterTextProps = {
  prompt?: string;
  href: string;
  label: string;
};

/** Centered muted prompt + accent link for auth card footers. */
export function AuthFooterText({ prompt, href, label }: AuthFooterTextProps) {
  return (
    <Typography
      sx={{
        textAlign: "center",
        fontSize: "0.875rem",
        color: "var(--eb-muted)",
      }}
    >
      {prompt ? <>{prompt} </> : null}
      <Link
        component={NextLink}
        href={href}
        underline="hover"
        sx={{
          fontWeight: 500,
          color: "var(--eb-gold-300)",
          "&:hover": { color: "var(--eb-gold-500)" },
        }}
      >
        {label}
      </Link>
    </Typography>
  );
}
