import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthFormCardProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Orchid-style form panel — inset on shared dark canvas (not a floating light card). */
export function AuthFormCard({
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  className,
}: AuthFormCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[520px] rounded-2xl border border-[var(--eb-border)] bg-[var(--eb-surface)]/45 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-9",
        className
      )}
    >
      <div className="mb-7 sm:mb-8">
        {eyebrow ? (
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--eb-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-[1.625rem] font-normal tracking-[-0.02em] text-[var(--eb-text)] sm:text-[1.75rem]",
            eyebrow && "mt-2"
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--eb-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-8 border-t border-[var(--eb-border)]/80 pt-6">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
