"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { USER_FACING } from "@/lib/errors/user-facing";
import { cn } from "@/lib/utils";

type ErrorFallbackProps = {
  title?: string;
  message: string;
  onReset?: () => void;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
  variant?: "marketing" | "dashboard" | "portal";
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
  const isDarkShell =
    variant === "marketing" || variant === "portal" || variant === "dashboard";

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center",
        variant === "marketing" || variant === "portal"
          ? "min-h-screen bg-[var(--eb-ink,#070F24)] text-[var(--eb-text,#F5F7FB)]"
          : "text-[var(--eb-text)]",
        className
      )}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl border border-[var(--eb-border,rgba(255,255,255,0.08))] bg-[var(--eb-surface,#0B1633)] text-[var(--eb-gold-500,#D9A63F)]"
        )}
      >
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold tracking-tight text-[var(--eb-text,#F5F7FB)]">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--eb-muted,#A9B4CF)]">
        {message}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--eb-gold-500,#D9A63F)] px-5 text-sm font-semibold text-[var(--eb-navy-950,#070F24)] shadow-[0_8px_24px_rgba(217,166,63,0.28)] transition-[filter] hover:brightness-105"
          >
            {USER_FACING.tryAgain}
          </button>
        ) : null}
        <Link
          href={homeHref}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors",
            isDarkShell
              ? "border-[var(--eb-border,rgba(255,255,255,0.08))] bg-[var(--eb-surface,#0B1633)] text-[var(--eb-text,#F5F7FB)] hover:border-[var(--eb-gold-500,#D9A63F)]"
              : "border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-text)]"
          )}
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
