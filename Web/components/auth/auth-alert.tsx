"use client";

import Alert from "@mui/material/Alert";
import type { ReactNode } from "react";

type AuthAlertProps = {
  variant: "error" | "success";
  children: ReactNode;
  className?: string;
};

export function AuthAlert({ variant, children, className }: AuthAlertProps) {
  const isError = variant === "error";

  return (
    <Alert
      severity={variant === "error" ? "error" : "success"}
      className={className}
      role="alert"
      sx={{
        mb: 3,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: isError
          ? "rgba(248, 113, 113, 0.3)"
          : "rgba(46, 196, 182, 0.3)",
        bgcolor: isError
          ? "rgba(248, 113, 113, 0.1)"
          : "rgba(46, 196, 182, 0.1)",
        color: isError ? "error.light" : "text.primary",
        "& .MuiAlert-icon": {
          color: isError ? "error.light" : "primary.main",
        },
      }}
    >
      {children}
    </Alert>
  );
}
