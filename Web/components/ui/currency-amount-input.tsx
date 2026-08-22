import { getCurrencySymbol } from "@/lib/money/format";
import { cn } from "@/lib/utils";

type CurrencyAmountInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  className?: string;
};

export function CurrencyAmountInput({
  id,
  label,
  value,
  onChange,
  currency,
  className,
}: CurrencyAmountInputProps) {
  const symbol = getCurrencySymbol(currency);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-slate-500">
        {label}
      </label>
      <div className="flex h-10 overflow-hidden rounded-lg border border-input bg-white">
        <span className="flex shrink-0 items-center border-r border-input bg-slate-50 px-3 text-sm font-medium text-slate-600">
          {symbol}
        </span>
        <input
          id={id}
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 px-3 text-sm outline-none"
        />
      </div>
    </div>
  );
}
