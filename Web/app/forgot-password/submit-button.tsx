"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ForgotPasswordSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? "Sending..." : "Send reset link"}
    </Button>
  );
}
