"use client";

import { useActionState, useState } from "react";
import {
  generateSetupCode,
  type GenerateSetupCodeState,
} from "@/app/(dashboard)/kiosk-setup/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: GenerateSetupCodeState | null = null;

export function GenerateSetupPanel() {
  const [state, formAction, pending] = useActionState(
    generateSetupCode,
    initialState
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Register a tablet</h2>
        <p className="text-sm text-slate-500">
          Generate a one-time setup code for the kiosk app on your tablet.
        </p>
      </CardHeader>
      <CardContent>
        {state?.setupCode ? (
          <div className="rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-8 text-center text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
              Setup code
              {state.locationName ? ` · ${state.locationName}` : ""}
            </p>
            <p className="mt-4 font-mono text-5xl font-bold tracking-wider sm:text-6xl">
              {state.setupCode}
            </p>
            <p className="mx-auto mt-6 max-w-md text-sm text-blue-100">
              Open the kiosk app and enter this code. It is consumed when the
              tablet registers.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-6 bg-white/20 text-white hover:bg-white/30"
              onClick={() => setShowForm(true)}
            >
              Generate another code
            </Button>
          </div>
        ) : null}

        {state?.error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
            <Button
              type="submit"
              disabled={pending}
              onClick={() => setShowForm(false)}
            >
              {pending ? "Generating..." : "Generate setup code"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
