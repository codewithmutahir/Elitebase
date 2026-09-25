"use client";



import { useActionState, useState } from "react";

import {

  generateSetupCode,

  type GenerateSetupCodeState,

} from "@/app/(dashboard)/kiosk-setup/actions";

import { PendingButton } from "@/components/dashboard/pending-button";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {

  dashboardCardClass,

  dashboardPageIntroClass,

  dashboardSectionTitleClass,

} from "@/lib/dashboard/styles";

import { cn } from "@/lib/utils";



const initialState: GenerateSetupCodeState | null = null;



export function GenerateSetupPanel() {

  const [state, formAction, pending] = useActionState(

    generateSetupCode,

    initialState

  );

  const [showForm, setShowForm] = useState(false);



  return (

    <Card className={cn(dashboardCardClass)}>

      <CardHeader>

        <h2 className={dashboardSectionTitleClass}>Register a tablet</h2>

        <p className={dashboardPageIntroClass}>

          Generate a one-time setup code for the kiosk app on your tablet.

        </p>

      </CardHeader>

      <CardContent>

        {state?.setupCode ? (

          <div className="rounded-xl border border-[var(--eb-accent)]/30 bg-gradient-to-br from-[var(--eb-accent)]/25 via-[var(--eb-surface)] to-[var(--eb-elevated)] p-8 text-center shadow-[0_0_40px_var(--eb-accent-glow,rgba(46,196,182,0.2))]">

            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--eb-muted)]">

              Setup code

              {state.locationName ? ` · ${state.locationName}` : ""}

            </p>

            <p className="mt-4 font-mono text-5xl font-bold tracking-wider text-[var(--eb-text)] sm:text-6xl">

              {state.setupCode}

            </p>

            <p className="mx-auto mt-6 max-w-md text-sm text-[var(--eb-muted)]">

              Open the kiosk app and enter this code. It is consumed when the

              tablet registers.

            </p>

            <Button

              type="button"

              variant="secondary"

              className="mt-6 border border-[var(--eb-border)] bg-[var(--eb-elevated)]/80 text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"

              onClick={() => setShowForm(true)}

            >

              Generate another code

            </Button>

          </div>

        ) : null}



        {state?.error ? (

          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">

            {state.error}

          </p>

        ) : null}



        {!state?.setupCode || showForm ? (

          <form action={formAction} className="space-y-4">

            <Input

              id="locationName"

              name="locationName"

              label="Location name"

              placeholder="Main Location"

            />

            <PendingButton

              type="submit"

              pending={pending}

              pendingLabel="Generating…"

              onClick={() => setShowForm(false)}

            >

              Generate setup code

            </PendingButton>

          </form>

        ) : null}

      </CardContent>

    </Card>

  );

}

