import { CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function TimeOffEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6 h-[120px] w-[200px] text-slate-200"
      aria-hidden
    >
      <rect
        x="24"
        y="28"
        width="152"
        height="96"
        rx="12"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M24 52h152"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="52" cy="40" r="4" fill="currentColor" />
      <circle cx="148" cy="40" r="4" fill="currentColor" />
      <rect x="44" y="68" width="24" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="76" y="68" width="24" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="108" y="68" width="24" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <rect x="44" y="88" width="24" height="8" rx="2" fill="currentColor" opacity="0.35" />
      <rect x="76" y="88" width="48" height="8" rx="2" fill="currentColor" opacity="0.35" />
      <path
        d="M118 98l28 28"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="146" cy="126" r="14" stroke="#94a3b8" strokeWidth="2" />
      <path
        d="M140 126h12M146 120v12"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        transform="rotate(45 146 126)"
      />
    </svg>
  );
}

export default function TimeOffPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <TimeOffEmptyIllustration />
      <CalendarOff
        className="mx-auto size-16 text-slate-300"
        strokeWidth={1.25}
        aria-hidden
      />
      <h2 className="mt-6 text-xl font-semibold text-slate-900">
        Time Off Management
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Time off policies, requests, and balances are coming in the next update.
      </p>
      <Button variant="outline" className="mt-8" disabled>
        Notify me
      </Button>
    </div>
  );
}
