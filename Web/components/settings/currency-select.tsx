"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  ALL_CURRENCIES,
  POPULAR_CURRENCIES,
  type CurrencyOption,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

type CurrencySelectProps = {
  defaultValue: string;
  name?: string;
};

function filterCurrencies(options: CurrencyOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(q) ||
      option.value.toLowerCase().includes(q)
  );
}

export function CurrencySelect({
  defaultValue,
  name = "currency",
}: CurrencySelectProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const filteredPopular = useMemo(
    () => filterCurrencies(POPULAR_CURRENCIES, query),
    [query]
  );

  const filteredAll = useMemo(() => {
    const popularCodes = new Set(POPULAR_CURRENCIES.map((item) => item.value));
    const others = ALL_CURRENCIES.filter((item) => !popularCodes.has(item.value));
    return filterCurrencies(others, query);
  }, [query]);

  const filteredCombined = useMemo(
    () => filterCurrencies(ALL_CURRENCIES, query),
    [query]
  );

  const selectedLabel =
    ALL_CURRENCIES.find((option) => option.value === selected)?.label ?? selected;

  const isSearching = query.trim().length > 0;

  function choose(option: CurrencyOption) {
    setSelected(option.value);
    setOpen(false);
    setQuery("");
  }

  function renderOption(option: CurrencyOption) {
    return (
      <li key={option.value}>
        <button
          type="button"
          className={cn(
            "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
            option.value === selected && "bg-blue-50 font-semibold text-blue-700"
          )}
          onClick={() => choose(option)}
        >
          {option.label}
        </button>
      </li>
    );
  }

  return (
    <div className="relative">
      <Label htmlFor="currency-search">Company currency</Label>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        id="currency-search"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "mt-1.5 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        <span>{selectedLabel}</span>
        <span className="text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search currencies (USD, PKR, Euro…)"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {isSearching ? (
              filteredCombined.length > 0 ? (
                filteredCombined.map(renderOption)
              ) : (
                <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
              )
            ) : (
              <>
                {filteredPopular.length > 0 ? (
                  <>
                    <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Popular
                    </li>
                    {filteredPopular.map(renderOption)}
                  </>
                ) : null}
                {filteredAll.length > 0 ? (
                  <>
                    <li className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      All currencies
                    </li>
                    {filteredAll.map(renderOption)}
                  </>
                ) : null}
              </>
            )}
          </ul>
        </div>
      ) : null}

      <p className="mt-1.5 text-xs text-slate-500">
        Used for hourly rates, salaries, and schedule wage totals.
      </p>
    </div>
  );
}
