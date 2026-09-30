"use client";

import { LatticeLoader } from "@/components/ui/lattice-loader";
import { Button, type ButtonProps } from "@/components/ui/button";
import { dashboardPrimaryButtonClass } from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";

type PendingButtonProps = ButtonProps & {
  pending?: boolean;
  pendingLabel?: string;
};

export function PendingButton({
  pending = false,
  pendingLabel,
  disabled,
  children,
  className,
  variant,
  ...props
}: PendingButtonProps) {
  const isDisabled = disabled || pending;
  const useAccentPrimary = !variant || variant === "default";

  return (
    <Button
      {...props}
      variant={variant}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cn(
        useAccentPrimary && dashboardPrimaryButtonClass,
        pending && "relative",
        className
      )}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <LatticeLoader size="sm" />
          <span>{pendingLabel ?? children}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
