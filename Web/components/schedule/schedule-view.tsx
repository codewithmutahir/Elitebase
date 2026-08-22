"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { publishDraftShifts } from "@/app/(dashboard)/schedule/schedule/actions";
import { AddShiftSheet, type AddShiftContext } from "@/components/schedule/add-shift-sheet";
import { ShiftCard } from "@/components/schedule/shift-card";
import { ShiftEditPopover } from "@/components/schedule/shift-edit-popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DepartmentWithRoles } from "@/lib/departments/queries";
import {
  formatHours,
  formatWages,
} from "@/lib/schedules/format";
import {
  dayEarnings,
  earningsLabel,
  employeeWeekEarnings,
} from "@/lib/schedules/wages";
import {
  groupShifts,
  type ScheduleEmployeeRow,
  type ScheduleShift,
} from "@/lib/schedules/queries";
import {
  GRID_DAYS,
  addWeeks,
  dateForDayInWeek,
  formatWeekParam,
  formatWeekRangeLong,
  isSameCalendarDay,
  parseWeekParam,
  toDateParam,
  weekDateStrings,
} from "@/lib/availability/week";
import { isWorkingDayOnDate } from "@/lib/employees/working-days";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

type ScheduleViewProps = {
  employees: ScheduleEmployeeRow[];
  shifts: ScheduleShift[];
  departments: DepartmentWithRoles[];
  weekStart: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ScheduleCell({
  shifts,
  onAdd,
  onUpdated,
  isOffDay = false,
}: {
  shifts: ScheduleShift[];
  onAdd: () => void;
  onUpdated: () => void;
  isOffDay?: boolean;
}) {
  if (isOffDay) {
    return (
      <td className="min-w-[110px] border-l border-slate-100 bg-slate-50/80 align-top p-0">
        <div className="flex min-h-[72px] items-center justify-center p-2">
          <span className="text-xs font-medium text-slate-400">Off</span>
        </div>
      </td>
    );
  }

  return (
    <td className="min-w-[110px] border-l border-slate-100 align-top p-0">
      <div className="group relative min-h-[72px] p-1">
        <div className="relative z-10">
          {shifts.map((shift) => (
            <ShiftEditPopover key={shift.id} shift={shift} onUpdated={onUpdated}>
              <ShiftCard shift={shift} />
            </ShiftEditPopover>
          ))}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="absolute right-1 top-1 z-20 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
          aria-label="Add shift"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </td>
  );
}

export function ScheduleView({
  employees,
  shifts,
  departments,
  weekStart,
}: ScheduleViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addContext, setAddContext] = useState<AddShiftContext | null>(null);

  const weekMonday = useMemo(() => parseWeekParam(weekStart), [weekStart]);
  const weekDates = useMemo(() => weekDateStrings(weekMonday), [weekMonday]);
  const weekLabel = formatWeekRangeLong(weekMonday);
  const today = useMemo(() => new Date(), []);

  const { openByDate, byEmployeeDate } = useMemo(
    () => groupShifts(shifts),
    [shifts]
  );

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const draftCount = useMemo(
    () => shifts.filter((s) => s.status === "draft").length,
    [shifts]
  );

  function goToWeek(monday: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", formatWeekParam(monday));
    router.push(`/schedule/schedule?${params.toString()}`);
  }

  function openAddSheet(context: AddShiftContext) {
    setAddContext(context);
    setSheetOpen(true);
  }

  function refresh() {
    router.refresh();
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishDraftShifts(weekStart);
      if (!result.error) refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToWeek(parseWeekParam(undefined))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToWeek(addWeeks(weekMonday, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-[240px] text-center text-sm font-semibold text-slate-900">
            {weekLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToWeek(addWeeks(weekMonday, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <select
            value="week"
            disabled
            className="ml-2 h-9 rounded-lg border border-input bg-transparent px-3 text-sm text-slate-600"
            aria-label="View"
          >
            <option value="week">Week</option>
          </select>
        </div>

        <Button
          type="button"
          disabled={pending || draftCount === 0}
          onClick={handlePublish}
        >
          {pending
            ? "Publishing…"
            : draftCount > 0
              ? `Publish (${draftCount})`
              : "Publish"}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="sticky top-0 z-30 bg-white shadow-sm">
              <tr className="border-b border-slate-200">
                <th className="sticky left-0 z-40 w-[220px] min-w-[220px] border-r border-slate-200 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  &nbsp;
                </th>
                {GRID_DAYS.map((day) => {
                  const date = dateForDayInWeek(weekMonday, day.dayOfWeek);
                  const isToday = isSameCalendarDay(date, today);
                  return (
                    <th
                      key={day.dayOfWeek}
                      className="min-w-[110px] border-l border-slate-100 px-2 py-3 text-center"
                    >
                      <div className="text-xs font-semibold uppercase text-slate-500">
                        {day.label}
                      </div>
                      <div className="mt-1 flex justify-center">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                            isToday
                              ? "bg-blue-600 text-white"
                              : "text-slate-800"
                          )}
                        >
                          {date.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <motion.tbody
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.tr variants={fadeIn} className="border-b border-slate-100">
                <td className="sticky left-0 z-20 w-[220px] min-w-[220px] border-r border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">Open shifts</p>
                  <p className="text-xs text-slate-500">Unassigned</p>
                </td>
                {weekDates.map((dateStr) => (
                  <ScheduleCell
                    key={`open-${dateStr}`}
                    shifts={openByDate[dateStr] ?? []}
                    onAdd={() =>
                      openAddSheet({
                        employeeId: null,
                        isOpenShift: true,
                        shiftDate: dateStr,
                      })
                    }
                    onUpdated={refresh}
                  />
                ))}
              </motion.tr>

              {employees.map((employee) => {
                const totals = employeeWeekEarnings(
                  employee,
                  shifts,
                  employee.id,
                  weekMonday
                );
                const payLabel = earningsLabel(employee.pay_type);
                return (
                  <motion.tr
                    key={employee.id}
                    variants={fadeIn}
                    className="border-b border-slate-100"
                  >
                    <td className="sticky left-0 z-20 w-[220px] min-w-[220px] border-r border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-blue-100 text-xs font-bold text-blue-700">
                            {initials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {employee.full_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatHours(totals.hours)} hrs / {payLabel}:{" "}
                            {formatWages(totals.wages)}
                          </p>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((dateStr) => {
                      const isOffDay = !isWorkingDayOnDate(
                        employee.working_days,
                        dateStr
                      );
                      return (
                        <ScheduleCell
                          key={`${employee.id}-${dateStr}`}
                          shifts={byEmployeeDate[employee.id]?.[dateStr] ?? []}
                          isOffDay={isOffDay}
                          onAdd={() =>
                            openAddSheet({
                              employeeId: employee.id,
                              isOpenShift: false,
                              shiftDate: dateStr,
                              employeeName: employee.full_name,
                            })
                          }
                          onUpdated={refresh}
                        />
                      );
                    })}
                  </motion.tr>
                );
              })}
            </motion.tbody>

            <tfoot className="sticky bottom-0 z-30 border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
              <tr>
                <td className="sticky left-0 z-40 w-[220px] min-w-[220px] border-r border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
                  Totals
                </td>
                {weekDates.map((dateStr) => {
                  const totals = dayEarnings(
                    employeesById,
                    shifts,
                    dateStr,
                    weekMonday
                  );
                  return (
                    <td
                      key={`total-${dateStr}`}
                      className="border-l border-slate-100 px-2 py-2 text-center text-xs text-slate-600"
                    >
                      <div className="leading-snug">
                        Wages: {formatWages(totals.wages)}
                      </div>
                      <div className="leading-snug">
                        Hours: {formatHours(totals.hours)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <AddShiftSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setAddContext(null);
        }}
        context={addContext}
        employees={employees}
        departments={departments}
        onSaved={refresh}
      />
    </div>
  );
}
