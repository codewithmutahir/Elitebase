"use client";

import { useFormStatus } from "react-dom";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

type LoginSubmitButtonProps = {
  disabled?: boolean;
};

export function LoginSubmitButton({ disabled: disabledProp }: LoginSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <AuthSubmitButton
      idleLabel="Sign in"
      pendingLabel="Signing in..."
      disabled={disabledProp || pending}
    />
  );
}
