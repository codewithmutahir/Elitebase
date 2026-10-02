"use client";

import Button from "@mui/material/Button";
import { useFormStatus } from "react-dom";
import { muiAlpha } from "@/lib/mui/alpha";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

/** Full-width primary CTA for auth forms — teal accent on dark canvas. */
export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
  disabled,
  className,
  onClick,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = pending;
  const isDisabled = Boolean(disabled || pending);

  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      color="primary"
      loading={isLoading}
      loadingPosition="start"
      disabled={isDisabled}
      onClick={onClick}
      className={className}
      sx={{
        borderRadius: 999,
        py: 1.5,
        px: 3.5,
        fontSize: "0.9375rem",
        fontWeight: 500,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        boxShadow: (theme) =>
          `0 0 24px ${muiAlpha(theme, (p) => p.primary.main, 0.35)}`,
        "&:hover": {
          bgcolor: "primary.dark",
          boxShadow: (theme) =>
            `0 0 28px ${muiAlpha(theme, (p) => p.primary.main, 0.45)}`,
        },
        "&.Mui-disabled": {
          bgcolor: "primary.main",
          color: "primary.contrastText",
          opacity: 0.45,
        },
      }}
    >
      {isLoading ? pendingLabel : idleLabel}
    </Button>
  );
}
