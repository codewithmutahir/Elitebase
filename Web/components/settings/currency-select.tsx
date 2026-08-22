"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ALL_CURRENCIES,
  POPULAR_CURRENCIES,
} from "@/lib/currencies";

type CurrencySelectProps = {
  defaultValue: string;
  name?: string;
};

export function CurrencySelect({
  defaultValue,
  name = "currency",
}: CurrencySelectProps) {
  const sections = useMemo(() => {
    const popularCodes = new Set(POPULAR_CURRENCIES.map((item) => item.value));
    const others = ALL_CURRENCIES.filter((item) => !popularCodes.has(item.value));

    return [
      { title: "Popular", options: POPULAR_CURRENCIES },
      { title: "All currencies", options: others },
    ];
  }, []);

  return (
    <SearchableSelect
      label="Company currency"
      name={name}
      defaultValue={defaultValue}
      sections={sections}
      searchPlaceholder="Search currencies (USD, PKR, Euro…)"
      helperText="Used for hourly rates, salaries, and schedule wage totals."
      emptyMessage="No currencies match your search"
    />
  );
}
