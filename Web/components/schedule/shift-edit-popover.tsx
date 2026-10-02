"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import {
  deleteScheduleShift,
  updateScheduleShift,
} from "@/app/(dashboard)/schedule/schedule/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  dashboardPopoverContentClass,
  dashboardPrimaryButtonClass,
} from "@/lib/dashboard/styles";
import { toInputTime } from "@/lib/schedules/format";
import type { ScheduleShift } from "@/lib/schedules/queries";
import { cn } from "@/lib/utils";

type ShiftEditPopoverProps = {
  shift: ScheduleShift;
  children: ReactElement;
  onUpdated: () => void;
};

export function ShiftEditPopover({
  shift,
  children,
  onUpdated,
}: ShiftEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(toInputTime(shift.start_time));
  const [endTime, setEndTime] = useState(toInputTime(shift.end_time));
  const [notes, setNotes] = useState(shift.notes ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateScheduleShift(shift.id, {
        startTime,
        endTime,
        notes,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onUpdated();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await deleteScheduleShift(shift.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onUpdated();
    });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setStartTime(toInputTime(shift.start_time));
          setEndTime(toInputTime(shift.end_time));
          setNotes(shift.notes ?? "");
          setError(null);
        }
      }}
    >
      <PopoverTrigger render={children} />
      <PopoverContent
        className={cn("w-72 p-3", dashboardPopoverContentClass)}
        align="start"
      >
        <PopoverHeader>
          <PopoverTitle className="text-sm">Edit shift</PopoverTitle>
        </PopoverHeader>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <Input
            id={`edit-start-${shift.id}`}
            label="Start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            id={`edit-end-${shift.id}`}
            label="End"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <Textarea
          id={`edit-notes-${shift.id}`}
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={pending}
            onClick={remove}
          >
            Delete
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn("flex-1", dashboardPrimaryButtonClass)}
            disabled={pending}
            onClick={save}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
