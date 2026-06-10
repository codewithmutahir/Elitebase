"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SettingsSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Saving..." : "Save settings"}
    </Button>
  );
}
