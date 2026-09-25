"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

const COOLDOWN_MS = 60_000;
const STORAGE_KEY = "employer-register-last-submit-at";

type SubmitButtonProps = {
  disabled?: boolean;
};

export function SubmitButton({ disabled: disabledProp }: SubmitButtonProps) {
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
  const label = isCoolingDown ? `Please wait ${secondsLeft}s` : "Create account";

  return (
    <AuthSubmitButton
      idleLabel={label}
      pendingLabel="Creating account..."
      disabled={disabledProp || isCoolingDown}
      onClick={() => {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }}
    />
  );
}
