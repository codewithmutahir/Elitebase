"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type AuthCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  children: ReactNode;
  className?: string;
  error?: string;
};

export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  function AuthCheckbox({ children, className, id, error, ...props }, ref) {
    return (
      <div className={cn("min-w-0", className)}>
        <label
          htmlFor={id}
          className="group flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-[var(--eb-muted)]"
        >
          <span className="relative mt-0.5 flex size-[1.125rem] shrink-0 items-center justify-center">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <span
              className={cn(
                "pointer-events-none absolute inset-0 rounded-[5px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/90 transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--eb-accent)]/35",
                "peer-checked:border-[var(--eb-accent)] peer-checked:bg-[var(--eb-accent)]/15",
                error && "border-red-400/60"
              )}
              aria-hidden
            />
            <Check
              className="relative z-[1] size-3 text-[var(--eb-accent)] opacity-0 transition-opacity peer-checked:opacity-100"
              strokeWidth={2.5}
              aria-hidden
            />
          </span>
          <span className="[&_a]:font-medium [&_a]:text-[var(--eb-accent)] [&_a]:underline-offset-2 [&_a]:hover:text-[var(--eb-text)] [&_a]:hover:underline">
            {children}
          </span>
        </label>
        {error ? (
          <p className="mt-1.5 pl-[calc(1.125rem+0.75rem)] text-xs text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
