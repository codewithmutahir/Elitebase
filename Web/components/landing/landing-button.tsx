"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type LandingButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "accent" | "light" | "ghost";
  size?: "nav" | "hero";
  className?: string;
  onClick?: () => void;
};

export function LandingButton({
  href,
  children,
  variant = "accent",
  size = "hero",
  className,
  onClick,
}: LandingButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "eb-btn group relative inline-flex max-w-full rounded-full p-px no-underline",
        className
      )}
    >
      <span
        className={cn(
          "eb-btn__content relative flex w-full min-w-0 items-center justify-center overflow-hidden rounded-full",
          size === "hero" && "px-7 py-4 text-[15px] font-medium",
          size === "nav" && "px-5 py-2.5 text-sm font-medium",
          variant === "accent" && "eb-btn__content--accent text-white",
          variant === "light" && "eb-btn__content--light text-[var(--eb-cta-secondary-fg)]",
          variant === "ghost" && "eb-btn__content--ghost text-[var(--eb-text)]"
        )}
      >
        <span className="relative z-[1]">{children}</span>
        <span
          className={cn(
            "eb-btn__bg absolute inset-0 rounded-full opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100",
            variant === "accent" && "eb-btn__bg--accent",
            variant === "light" && "eb-btn__bg--light",
            variant === "ghost" && "eb-btn__bg--ghost"
          )}
          aria-hidden
        />
      </span>
    </Link>
  );
}
