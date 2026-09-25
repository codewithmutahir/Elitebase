"use client";

import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

export type TimezoneOption = SearchableSelectOption;

type TimezoneSelectProps = {
  options: TimezoneOption[];
  defaultValue: string;
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
};

export function TimezoneSelect({
  options,
  defaultValue,
  name = "timezone",
  value,
  onValueChange,
  error,
}: TimezoneSelectProps) {
  return (
    <SearchableSelect
      variant="auth"
      label="Company timezone"
      name={name}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      options={options}
      searchPlaceholder="Search timezones…"
      helperText="Used for schedules and attendance timestamps."
      emptyMessage="No timezones match your search"
      error={error}
    />
  );
}
