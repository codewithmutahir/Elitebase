"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { publishDraftShifts } from "@/app/(dashboard)/schedule/schedule/actions";
import { AddShiftSheet, type AddShiftContext } from "@/components/schedule/add-shift-sheet";
import { ShiftCard } from "@/components/schedule/shift-card";
import { ShiftEditPopover } from "@/components/schedule/shift-edit-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  formatOvertimeWarning,
  getScheduleOvertimeWarnings,
} from "@/lib/schedules/overtime";
import { isWorkingDayOnDate } from "@/lib/employees/working-days";
import { useCompany } from "@/contexts/company-context";
import { resolveCurrency } from "@/lib/currencies";
import { fadeIn, staggerContainer } from "@/lib/animations";
import {
  dashboardCardClass,
  dashboardGridBodyCellClass,
  dashboardGridCornerHeadClass,
  dashboardGridDayHeadClass,
  dashboardGridOffDayCellClass,
  dashboardGridRowLabelCellClass,
  dashboardGridRowLabelCellMutedClass,
  dashboardGridTheadClass,
  dashboardGridTfootClass,
  dashboardDialogContentClass,
  dashboardNativeSelectClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
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
      <td className={dashboardGridOffDayCellClass}>
        <div className="flex min-h-[72px] items-center justify-center p-2">
          <span className="text-xs font-medium text-[var(--eb-muted)]">Off</span>
        </div>
      </td>
    );
  }

  return (
    <td className={dashboardGridBodyCellClass}>
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
          className="absolute right-1 top-1 z-20 flex size-7 items-center justify-center rounded-full bg-[var(--eb-accent)] text-[var(--eb-ink,#060A12)] opacity-0 shadow-md transition-opacity group-hover:opacity-100"
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
  const { company } = useCompany();
  const currency = resolveCurrency(company.currency);
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addContext, setAddContext] = useState<AddShiftContext | null>(null);
  const [overtimeOpen, setOvertimeOpen] = useState(false);

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

  const overtimeWarnings = useMemo(() => {
    const names = new Map(
      employees.map((employee) => [employee.id, employee.full_name])
    );
    return getScheduleOvertimeWarnings(shifts, names, true);
  }, [employees, shifts]);

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
    if (overtimeWarnings.length > 0) {
      setOvertimeOpen(true);
      return;
    }
    confirmPublish();
  }

  function confirmPublish() {
    setOvertimeOpen(false);
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
          <span className="min-w-[240px] text-center text-sm font-semibold text-[var(--eb-text)]">
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
            className={cn(dashboardNativeSelectClass, "ml-2 h-9 w-auto py-0")}
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

      <Card className={cn("overflow-hidden", dashboardCardClass)}>
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className={dashboardGridTheadClass}>
              <tr>
                <th className={dashboardGridCornerHeadClass}>&nbsp;</th>
                {GRID_DAYS.map((day) => {
                  const date = dateForDayInWeek(weekMonday, day.dayOfWeek);
                  const isToday = isSameCalendarDay(date, today);
                  return (
                    <th
                      key={day.dayOfWeek}
                      className={dashboardGridDayHeadClass}
                    >
                      <div className="text-xs font-semibold uppercase text-[var(--eb-muted)]">
                        {day.label}
                      </div>
                      <div className="mt-1 flex justify-center">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                            isToday
                              ? "bg-[var(--eb-accent)] text-[var(--eb-ink,#060A12)]"
                              : "text-[var(--eb-text)]"
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
              <motion.tr
                variants={fadeIn}
                className="border-b border-[var(--eb-border)]"
              >
                <td className={dashboardGridRowLabelCellMutedClass}>
                  <p className="font-semibold text-[var(--eb-text)]">
                    Open shifts
                  </p>
                  <p className="text-xs text-[var(--eb-muted)]">Unassigned</p>
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
                    className="border-b border-[var(--eb-border)]"
                  >
                    <td className={dashboardGridRowLabelCellClass}>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-[var(--eb-accent)]/15 text-xs font-bold text-[var(--eb-accent)]">
                            {initials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--eb-text)]">
                            {employee.full_name}
                          </p>
                          <p className="text-xs text-[var(--eb-muted)]">
                            {formatHours(totals.hours)} hrs / {payLabel}:{" "}
                            {formatWages(totals.wages, currency)}
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

            <tfoot className={dashboardGridTfootClass}>
              <tr>
                <td
                  className={cn(
                    dashboardGridCornerHeadClass,
                    "py-2 normal-case"
                  )}
                >
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
                      className="border-l border-[var(--eb-border)] px-2 py-2 text-center text-xs text-[var(--eb-muted)]"
                    >
                      <div className="leading-snug">
                        Wages: {formatWages(totals.wages, currency)}
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

      <Dialog open={overtimeOpen} onOpenChange={setOvertimeOpen}>
        <DialogContent
          className={cn("sm:max-w-md", dashboardDialogContentClass)}
        >
          <DialogHeader>
            <DialogTitle>Overtime warnings</DialogTitle>
            <DialogDescription>
              These draft shifts exceed 8 hours/day or 40 hours/week. You can
              still publish if this is intentional.
            </DialogDescription>
          </DialogHeader>
          <ul
            className={cn(
              "max-h-48 space-y-2 overflow-y-auto text-sm",
              dashboardPageIntroClass
            )}
          >
            {overtimeWarnings.map((warning) => (
              <li key={`${warning.kind}-${warning.employeeId}-${warning.date ?? "week"}`}>
                {formatOvertimeWarning(warning)}
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOvertimeOpen(false)}
            >
              Review schedule
            </Button>
            <Button type="button" disabled={pending} onClick={confirmPublish}>
              {pending ? "Publishing…" : "Publish anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
