import Link from "next/link";
import { cn } from "@/lib/utils";

const defaultFeatures = [
  "Kiosk PIN clock-in at every location",
  "Optional face verification on tablets",
  "Live dashboard and exportable timesheets",
] as const;

type AuthBrandPanelProps = {
  tagline?: string;
  features?: readonly string[];
  className?: string;
};

export function AuthBrandPanel({
  tagline = "Time tracking and kiosk clock-in built for growing teams.",
  features = defaultFeatures,
  className,
}: AuthBrandPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden flex-col justify-center px-8 py-12 lg:flex xl:px-14 xl:py-16",
        className
      )}
    >
      <p className="max-w-md text-[clamp(1.35rem,2.2vw,1.75rem)] font-normal leading-snug tracking-[-0.02em] text-[var(--eb-text)]">
        {tagline}
      </p>

      <ul className="mt-10 max-w-md space-y-4">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm leading-relaxed text-[var(--eb-text)]/88"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--eb-accent)]/35 bg-[var(--eb-accent)]/10 text-[0.65rem] font-bold text-[var(--eb-accent)]">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className="mt-12 inline-flex w-fit text-sm font-medium text-[var(--eb-accent)] transition-colors hover:text-[var(--eb-text)]"
      >
        ← Back to role selection
      </Link>
    </aside>
  );
}
