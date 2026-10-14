"use client";

import Button from "@mui/material/Button";
import { useFormStatus } from "react-dom";
type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

/** Full-width primary CTA for auth forms — gold accent on dark canvas. */
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
        background: "var(--eb-gold-gradient)",
        color: "var(--eb-navy-950)",
        boxShadow: "0 8px 24px var(--eb-gold-glow)",
        "&:hover": {
          filter: "brightness(1.06)",
          boxShadow: "0 10px 28px rgba(217, 166, 63, 0.32)",
          background: "var(--eb-gold-gradient)",
        },
        "&.Mui-disabled": {
          background: "var(--eb-gold-gradient)",
          color: "var(--eb-navy-950)",
          opacity: 0.45,
        },
      }}
    >
      {isLoading ? pendingLabel : idleLabel}
    </Button>
  );
}
