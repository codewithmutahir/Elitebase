"use client";

import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PinDisplayCardProps = {
  employeeId: string;
  hasPin: boolean;
  pin: string | null;
};

export function PinDisplayCard({ employeeId, hasPin, pin }: PinDisplayCardProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-slate-900">Kiosk PIN</h2>
        <p className="text-sm text-slate-500">
          Use the eye icon to reveal the PIN for kiosk clock-in.
        </p>
      </CardHeader>
      <CardContent>
        {hasPin ? (
          <RosterPinCell employeeId={employeeId} hasPin={hasPin} pin={pin} />
        ) : (
          <p className="font-mono text-2xl text-slate-400">— — — —</p>
        )}
      </CardContent>
    </Card>
  );
}
