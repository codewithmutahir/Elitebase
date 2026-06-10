"use client";

import { motion } from "framer-motion";
import { formatShiftTimeRange } from "@/lib/schedules/format";
import type { ScheduleShift } from "@/lib/schedules/queries";
import { fadeIn } from "@/lib/animations";
import { cn } from "@/lib/utils";

type ShiftCardProps = {
  shift: ScheduleShift;
};

export function ShiftCard({ shift }: ShiftCardProps) {
  return (
    <motion.button
      type="button"
      variants={fadeIn}
      initial="initial"
      animate="animate"
      layout
      className={cn(
        "mb-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold text-white shadow-sm transition hover:brightness-95",
        shift.status === "draft" && "ring-1 ring-white/40 ring-offset-1 ring-offset-white"
      )}
      style={{ backgroundColor: shift.color }}
    >
      <span className="block leading-tight">
        {formatShiftTimeRange(shift.start_time, shift.end_time)}
      </span>
      {shift.status === "draft" ? (
        <span className="mt-0.5 block text-[10px] font-medium opacity-80">
          Draft
        </span>
      ) : null}
    </motion.button>
  );
}
