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
    <div
      className={cn(
        "relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Elite<span className="text-blue-200">base</span>
        </Link>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-blue-100">
          {tagline}
        </p>
      </div>

      <ul className="relative mt-10 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-blue-50">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <p className="relative mt-auto text-xs text-blue-200/80">
        Trusted by retail, hospitality, and service businesses nationwide.
      </p>
    </div>
  );
}
