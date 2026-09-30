"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateTimesheetShift } from "@/app/(dashboard)/timesheets/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { companyTimezone } from "@/lib/dashboard/format";
import {
  dashboardDialogContentClass,
  dashboardFieldInputClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";
import { isoToLocalTimeHm } from "@/lib/timesheets/dates";
import type { TimesheetRow } from "@/lib/timesheets/pairing";

type EditTimesheetDialogProps = {
  row: TimesheetRow;
  timezone: string | null | undefined;
};

export function EditTimesheetDialog({
  row,
  timezone,
}: EditTimesheetDialogProps) {
  const router = useRouter();
  const tz = companyTimezone(timezone);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");

  function resetFromRow() {
    setClockInTime(row.clockIn ? isoToLocalTimeHm(row.clockIn, tz) : "");
    setClockOutTime(row.clockOut ? isoToLocalTimeHm(row.clockOut, tz) : "");
    setError(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateTimesheetShift({
        employeeId: row.employeeId,
        date: row.date,
        clockInTime,
        clockOutTime,
        clockInEventId: row.clockInEventId,
        clockOutEventId: row.clockOutEventId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetFromRow();
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </DialogTrigger>
      <DialogContent
        className={cn("sm:max-w-md", dashboardDialogContentClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit timesheet</DialogTitle>
          <DialogDescription>
            {row.employeeName} ·{" "}
            {row.clockOutDate
              ? `${row.date} → ${row.clockOutDate}`
              : row.date}
            . Times use company timezone ({tz}).
            {row.clockOutDate
              ? " Clock out is on the next calendar day."
              : null}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`clock-in-${row.id}`}>Clock in</Label>
            <Input
              id={`clock-in-${row.id}`}
              type="time"
              className={dashboardFieldInputClass}
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`clock-out-${row.id}`}>Clock out</Label>
            <Input
              id={`clock-out-${row.id}`}
              type="time"
              className={dashboardFieldInputClass}
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
            />
          </div>
        </div>

        <p className={cn("text-xs", dashboardPageIntroClass)}>
          Leave a field empty to remove that punch. Add a missing time to
          create it. For overnight shifts, clock out earlier than clock in
          (e.g. 5:21 AM after 9:01 PM) is saved on the next day automatically.
        </p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
