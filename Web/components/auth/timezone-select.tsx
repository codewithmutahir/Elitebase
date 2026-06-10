"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TimezoneOption = {
  value: string;
  label: string;
};

type TimezoneSelectProps = {
  options: TimezoneOption[];
  defaultValue: string;
  name?: string;
};

export function TimezoneSelect({
  options,
  defaultValue,
  name = "timezone",
}: TimezoneSelectProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selectedLabel =
    options.find((opt) => opt.value === selected)?.label ?? selected;

  return (
    <div className="relative">
      <Label htmlFor="timezone-search">Company timezone</Label>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        id="timezone-search"
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
              placeholder="Search timezones..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                    opt.value === selected && "bg-blue-50 font-semibold text-blue-700"
                  )}
                  onClick={() => {
                    setSelected(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <p className="mt-1.5 text-xs text-slate-500">
        Used for schedules and attendance timestamps.
      </p>
    </div>
  );
}
