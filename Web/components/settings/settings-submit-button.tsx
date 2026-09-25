"use client";



import { useFormStatus } from "react-dom";

import { PendingButton } from "@/components/dashboard/pending-button";



export function SettingsSubmitButton() {

  const { pending } = useFormStatus();



  return (

    <PendingButton type="submit" pending={pending} pendingLabel="Saving…" size="lg">

      Save settings

    </PendingButton>

  );

}

