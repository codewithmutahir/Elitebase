"use client";

import Autocomplete from "@mui/material/Autocomplete";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";

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
  /** `auth` — navy/gold fields on dark onboarding & auth shells; default `light` for dashboard settings. */
  variant?: SearchableSelectVariant;
};

type FlatOption = SearchableSelectOption & { group?: string };

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
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultValue);
  const selected = valueProp ?? uncontrolledSelected;
  const isAuth = variant === "auth";

  const flatOptions: FlatOption[] = useMemo(() => {
    if (sections?.length) {
      return sections.flatMap((section) =>
        section.options.map((option) => ({ ...option, group: section.title }))
      );
    }
    return options;
  }, [options, sections]);

  const selectedOption =
    flatOptions.find((option) => option.value === selected) ?? null;

  function choose(next: string) {
    if (valueProp === undefined) setUncontrolledSelected(next);
    onValueChange?.(next);
  }

  return (
    <div data-slot="searchable-select" style={{ width: "100%", minWidth: 0 }}>
      <Label htmlFor={`${name}-input`}>{label}</Label>
      <input type="hidden" name={name} value={selected} />
      <Autocomplete
        id={`${name}-input`}
        options={flatOptions}
        value={selectedOption}
        onChange={(_, next) => {
          choose(next?.value ?? "");
        }}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        groupBy={sections?.length ? (option) => option.group ?? "" : undefined}
        noOptionsText={emptyMessage}
        fullWidth
        sx={{ mt: 1.5 }}
        slotProps={{
          paper: {
            sx: {
              backgroundImage: "none",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={searchPlaceholder}
            error={Boolean(error)}
            size="medium"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                minHeight: 44,
                ...(isAuth
                  ? {
                      backgroundColor: "action.hover",
                    }
                  : null),
              },
            }}
          />
        )}
      />
      {error ? (
        <FormHelperText error sx={{ mx: 0, mt: 1.5 }}>
          {error}
        </FormHelperText>
      ) : helperText ? (
        <FormHelperText sx={{ mx: 0, mt: 1.5 }}>{helperText}</FormHelperText>
      ) : null}
    </div>
  );
}
