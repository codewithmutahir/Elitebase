"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { regenerateEmployeePin } from "@/app/(dashboard)/employees/actions";

type RosterPinCellProps = {
  employeeId: string;
  hasPin: boolean;
  pin: string | null;
};

export function RosterPinCell({ employeeId, hasPin, pin }: RosterPinCellProps) {
  const [visible, setVisible] = useState(false);
  const [displayPin, setDisplayPin] = useState(pin);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDisplayPin(pin);
  }, [pin]);

  if (!hasPin) {
    return <span className="text-slate-400">—</span>;
  }

  function handleToggle() {
    setError(null);

    if (visible) {
      setVisible(false);
      return;
    }

    if (displayPin) {
      setVisible(true);
      return;
    }

    const confirmed = window.confirm(
      "This employee's PIN was created before display was enabled. Generate a new 4-digit PIN? The old PIN will stop working on the kiosk."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await regenerateEmployeePin(employeeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.pin) {
        setDisplayPin(result.pin);
        setVisible(true);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1.5 font-mono text-sm">
        <span className="min-w-[2.5rem] tabular-nums">
          {visible && displayPin ? displayPin : "••••"}
        </span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
          aria-label={visible ? "Hide PIN" : "Show PIN"}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </span>
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : null}
    </span>
  );
}
