"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

const COOLDOWN_MS = 60_000;
const STORAGE_KEY = "employer-register-last-submit-at";

export function SubmitButton() {
  const { pending } = useFormStatus();
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    const updateRemaining = () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setRemainingMs(0);
        return;
      }

      const lastSubmitAt = Number(raw);
      if (!Number.isFinite(lastSubmitAt)) {
        setRemainingMs(0);
        return;
      }

      const remaining = Math.max(0, lastSubmitAt + COOLDOWN_MS - Date.now());
      setRemainingMs(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 500);
    return () => window.clearInterval(timer);
  }, []);

  const isCoolingDown = remainingMs > 0;
  const secondsLeft = useMemo(() => Math.ceil(remainingMs / 1000), [remainingMs]);
  const disabled = pending || isCoolingDown;
  const label = pending
    ? "Creating account..."
    : isCoolingDown
      ? `Please wait ${secondsLeft}s`
      : "Create account";

  return (
    <Button
      type="submit"
      disabled={disabled}
      size="lg"
      className="w-full"
      onClick={() => {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }}
    >
      {label}
    </Button>
  );
}
