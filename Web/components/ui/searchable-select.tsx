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

type SearchableSelectVariant = "light" | "auth";

type SearchableSelectProps = {
  label: string;
  name: string;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options?: SearchableSelectOption[];
  sections?: SearchableSelectSection[];
  searchPlaceholder?: string;
  helperText?: string;
  emptyMessage?: string;
  error?: string;
  /** `auth` — ink/teal fields on dark onboarding & auth shells; default `light` for dashboard settings. */
  variant?: SearchableSelectVariant;
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
  value: valueProp,
  onValueChange,
  options = [],
  sections,
  searchPlaceholder = "Search…",
  helperText,
  emptyMessage = "No matches",
  error,
  variant = "light",
}: SearchableSelectProps) {
  const isAuth = variant === "auth";
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultValue);
  const selected = valueProp ?? uncontrolledSelected;
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
    if (valueProp === undefined) {
      setUncontrolledSelected(value);
    }
    onValueChange?.(value);
    setOpen(false);
    setQuery("");
  }

  function renderOption(option: SearchableSelectOption) {
    return (
      <li key={option.value}>
        <button
          type="button"
          className={cn(
            "w-full px-3 py-2.5 text-left text-sm transition-colors",
            isAuth
              ? [
                  "text-[var(--eb-text)] hover:bg-white/[0.06]",
                  option.value === selected &&
                    "bg-[var(--eb-accent)]/15 font-medium text-[var(--eb-accent)]",
                ]
              : [
                  "hover:bg-slate-50",
                  option.value === selected &&
                    "bg-blue-50 font-semibold text-blue-700",
                ]
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
      <Label
        htmlFor={id}
        className={cn(
          isAuth && "font-normal text-[var(--eb-text)]"
        )}
      >
        {label}
      </Label>
      <input type="hidden" name={name} value={selected} />

      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "mt-1.5 flex h-11 w-full min-w-0 items-center justify-between gap-2 px-3.5 text-left text-sm outline-none transition-[border-color,box-shadow]",
          isAuth
            ? [
                "rounded-[10px] border border-[var(--eb-border)] bg-[var(--eb-elevated)]/70 text-[var(--eb-text)]",
                "focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25",
                open && "border-[var(--eb-accent)] ring-2 ring-[var(--eb-accent)]/25",
                error &&
                  "border-red-400/60 focus:border-red-400 focus:ring-red-400/20",
              ]
            : [
                "rounded-lg border border-slate-200 bg-white py-2.5 text-slate-900",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
              ]
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <span
          className={cn(
            "shrink-0 text-xs",
            isAuth ? "text-[var(--eb-muted)]" : "text-slate-400"
          )}
          aria-hidden
        >
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          className={cn(
            "mt-2 w-full min-w-0 overflow-hidden rounded-[10px] border shadow-lg",
            isAuth
              ? "border-[var(--eb-border)] bg-[var(--eb-surface)] shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
              : "border-slate-200 bg-white shadow-sm"
          )}
        >
          <div
            className={cn(
              "p-2",
              isAuth ? "border-b border-[var(--eb-border)]" : "border-b border-slate-100"
            )}
          >
            <input
              ref={searchRef}
              type="text"
              inputMode="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "box-border w-full min-w-0 max-w-full rounded-md border px-3 py-2 text-sm outline-none transition-[border-color,box-shadow]",
                isAuth
                  ? "border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 text-[var(--eb-text)] placeholder:text-[var(--eb-muted)] focus:border-[var(--eb-accent)] focus:ring-2 focus:ring-[var(--eb-accent)]/25"
                  : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              )}
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
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                      isAuth ? "text-[var(--eb-muted)]" : "text-slate-400"
                    )}
                  >
                    {section.title}
                  </li>,
                  ...section.options.map(renderOption),
                ])
              : filteredOptions.map(renderOption)}
            {!hasResults ? (
              <li
                className={cn(
                  "px-3 py-2 text-sm",
                  isAuth ? "text-[var(--eb-muted)]" : "text-slate-500"
                )}
              >
                {emptyMessage}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            isAuth ? "text-red-300" : "text-red-400"
          )}
          role="alert"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          className={cn(
            "mt-1.5 text-xs",
            isAuth ? "text-[var(--eb-muted)]" : "text-slate-500"
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
