"use client";

import { cn } from "@/lib/utils";

export type DashboardTab<T extends string> = {
  id: T;
  label: string;
};

type DashboardTabsProps<T extends string> = {
  tabs: DashboardTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function DashboardTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: DashboardTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-1 border-b border-[var(--eb-border)]",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "dashboard-tab border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "dashboard-tab--active" : "dashboard-tab--inactive"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
