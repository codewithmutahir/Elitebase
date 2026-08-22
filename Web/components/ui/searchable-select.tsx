"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectSection = {
  title: string;
  options: SearchableSelectOption[];
};

type SearchableSelectProps = {
  label: string;
  name: string;
  defaultValue: string;
  options?: SearchableSelectOption[];
  sections?: SearchableSelectSection[];
  searchPlaceholder?: string;
  helperText?: string;
  emptyMessage?: string;
};

function filterOptions(options: SearchableSelectOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(q) ||
      option.value.toLowerCase().includes(q)
  );
}

export function SearchableSelect({
  label,
  name,
  defaultValue,
  options = [],
  sections,
  searchPlaceholder = "Search…",
  helperText,
  emptyMessage = "No matches",
}: SearchableSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const flatOptions = useMemo(() => {
    if (sections?.length) {
      return sections.flatMap((section) => section.options);
    }
    return options;
  }, [options, sections]);

  const selectedLabel =
    flatOptions.find((option) => option.value === selected)?.label ?? selected;

  const isSearching = query.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!sections) return null;
    if (isSearching) {
      const filtered = filterOptions(flatOptions, query);
      return filtered.length > 0 ? [{ title: "Results", options: filtered }] : [];
    }
    return sections
      .map((section) => ({
        title: section.title,
        options: filterOptions(section.options, query),
      }))
      .filter((section) => section.options.length > 0);
  }, [sections, flatOptions, query, isSearching]);

  const filteredOptions = useMemo(
    () => filterOptions(options, query),
    [options, query]
  );

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  function choose(value: string) {
    setSelected(value);
    setOpen(false);
    setQuery("");
  }

  function renderOption(option: SearchableSelectOption) {
    return (
      <li key={option.value}>
        <button
          type="button"
          className={cn(
            "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
            option.value === selected && "bg-blue-50 font-semibold text-blue-700"
          )}
          onClick={() => choose(option.value)}
        >
          {option.label}
        </button>
      </li>
    );
  }

  const hasResults = sections
    ? (filteredSections?.length ?? 0) > 0
    : filteredOptions.length > 0;

  return (
    <div ref={rootRef} className="w-full min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "mt-1.5 flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="mt-2 w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-2">
            <input
              ref={searchRef}
              type="text"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="box-border w-full min-w-0 max-w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {sections && filteredSections
              ? filteredSections.flatMap((section) => [
                  <li
                    key={`${section.title}-header`}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {section.title}
                  </li>,
                  ...section.options.map(renderOption),
                ])
              : filteredOptions.map(renderOption)}
            {!hasResults ? (
              <li className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
