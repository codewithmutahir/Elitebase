import { getCurrencySymbol } from "@/lib/money/format";
import { cn } from "@/lib/utils";

type CurrencyAmountInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  className?: string;
  /** Uses dashboard shell tokens (ink/teal) instead of light form chrome */
  variant?: "default" | "dashboard";
};

export function CurrencyAmountInput({
  id,
  label,
  value,
  onChange,
  currency,
  className,
  variant = "default",
}: CurrencyAmountInputProps) {
  const symbol = getCurrencySymbol(currency);
  const isDashboard = variant === "dashboard";

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-xs font-semibold",
          isDashboard
            ? "uppercase tracking-wide text-[var(--eb-muted)]"
            : "text-slate-500"
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          "flex h-10 overflow-hidden rounded-[10px] border",
          isDashboard
            ? "border-[var(--eb-border)] bg-[var(--eb-elevated)]/70"
            : "rounded-lg border-input bg-white"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center border-r px-3 text-sm font-medium",
            isDashboard
              ? "border-[var(--eb-border)] bg-[var(--eb-surface)]/80 text-[var(--eb-muted)]"
              : "border-input bg-slate-50 text-slate-600"
          )}
        >
          {symbol}
        </span>
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "min-w-0 flex-1 px-3 text-sm outline-none",
            isDashboard &&
              "bg-transparent text-[var(--eb-text)] focus-visible:ring-0"
          )}
        />
      </div>
    </div>
  );
}
