"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import {
  deleteScheduleShift,
  updateScheduleShift,
} from "@/app/(dashboard)/schedule/schedule/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toInputTime } from "@/lib/schedules/format";
import type { ScheduleShift } from "@/lib/schedules/queries";

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
      <PopoverContent className="w-72 p-3" align="start">
        <PopoverHeader>
          <PopoverTitle className="text-sm">Edit shift</PopoverTitle>
        </PopoverHeader>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor={`edit-start-${shift.id}`} className="text-xs">
              Start
            </Label>
            <input
              id={`edit-start-${shift.id}`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`edit-end-${shift.id}`} className="text-xs">
              End
            </Label>
            <input
              id={`edit-end-${shift.id}`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`edit-notes-${shift.id}`} className="text-xs">
            Notes
          </Label>
          <textarea
            id={`edit-notes-${shift.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

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
            className="flex-1"
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
