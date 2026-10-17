"use client";

import { openCookieSettings } from "@/lib/analytics/consent";

type CookieSettingsButtonProps = {
  className?: string;
};

export function CookieSettingsButton({ className }: CookieSettingsButtonProps) {
  return (
    <button
      type="button"
      onClick={() => openCookieSettings()}
      className={
        className ??
        "text-[var(--eb-muted)] transition-colors hover:text-[var(--eb-text)]"
      }
    >
      Cookie settings
    </button>
  );
}
