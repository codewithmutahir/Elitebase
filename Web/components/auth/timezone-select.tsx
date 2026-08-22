"use client";

import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

export type TimezoneOption = SearchableSelectOption;

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
  return (
    <SearchableSelect
      label="Company timezone"
      name={name}
      defaultValue={defaultValue}
      options={options}
      searchPlaceholder="Search timezones…"
      helperText="Used for schedules and attendance timestamps."
      emptyMessage="No timezones match your search"
    />
  );
}
