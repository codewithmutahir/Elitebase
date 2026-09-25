"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER_FACING } from "@/lib/errors/user-facing";
import { cn } from "@/lib/utils";

type ErrorFallbackProps = {
  title?: string;
  message: string;
  onReset?: () => void;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
  variant?: "marketing" | "dashboard";
};

export function ErrorFallback({
  title = "Something went wrong",
  message,
  onReset,
  homeHref = "/dashboard",
  homeLabel = USER_FACING.backToDashboard,
  className,
  variant = "dashboard",
}: ErrorFallbackProps) {
  const isMarketing = variant === "marketing";

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center",
        isMarketing
          ? "bg-[var(--eb-ink,#060A12)] text-[var(--eb-text,#ECEEF2)]"
          : "text-[var(--eb-text)]",
        className
      )}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl border",
          isMarketing
            ? "border-[var(--eb-border)] bg-[var(--eb-surface)] text-[var(--eb-accent)]"
            : "border-[var(--eb-border)] bg-[var(--eb-surface)]/80 text-[var(--eb-accent)]"
        )}
      >
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-[var(--eb-muted)]">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onReset ? (
          <Button type="button" onClick={onReset}>
            {USER_FACING.tryAgain}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          render={<Link href={homeHref} />}
        >
          {homeLabel}
        </Button>
      </div>
    </div>
  );
}
