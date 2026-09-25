import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Reference-style auth input: placeholder label, teal focus ring, dark fill. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { label, hint, error, className, id, name, required, ...props },
    ref
  ) {
    const fieldId = id ?? name;
    const placeholder =
      required || props["aria-required"]
        ? `${label} *`
        : label;

    return (
      <div className="min-w-0">
        <input
          ref={ref}
          id={fieldId}
          name={name}
          aria-label={label}
          placeholder={placeholder}
          className={cn(
            "h-11 w-full min-w-0 rounded-[10px] border bg-[var(--eb-elevated)]/70 px-3.5 text-sm text-[var(--eb-text)] outline-none transition-[border-color,box-shadow]",
            "border-[var(--eb-border)] placeholder:text-[var(--eb-muted)]",
            "focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25",
            error &&
              "border-red-400/60 focus:border-red-400 focus:ring-red-400/20",
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-red-300" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-[var(--eb-muted)]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
