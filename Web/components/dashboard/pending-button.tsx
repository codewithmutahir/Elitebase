"use client";

import { LatticeLoader } from "@/components/ui/lattice-loader";
import { Button, type ButtonProps } from "@/components/ui/button";
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
  ...props
}: PendingButtonProps) {
  const isDisabled = disabled || pending;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cn(pending && "relative", className)}
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
