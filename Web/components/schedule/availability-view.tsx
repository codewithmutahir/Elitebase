"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  upsertEmployeeAvailability,
  type AvailabilityUpdateMode,
} from "@/app/(dashboard)/schedule/availability/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { downloadAvailabilityCsv } from "@/lib/availability/export";
import {
  cellDisplayLabel,
  getCellDisplayState,
  toInputTime,
} from "@/lib/availability/format";
import type {
  AvailabilityByEmployee,
  AvailabilitySlot,
  EmployeeAvailabilityRow,
} from "@/lib/availability/queries";
import {
  GRID_DAYS,
  addWeeks,
  dateForDayInWeek,
  formatWeekParam,
  formatWeekRangeLabel,
  parseWeekParam,
  shortDateLabel,
} from "@/lib/availability/week";
import type { DepartmentOption } from "@/lib/departments/queries";
import { fadeIn, staggerContainer } from "@/lib/animations";
import {
  dashboardCardClass,
  dashboardFieldInputClass,
  dashboardNativeSelectClass,
  dashboardPageIntroClass,
  dashboardPopoverContentClass,
  dashboardStickyTableCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils";

type AvailabilityViewProps = {
  employees: EmployeeAvailabilityRow[];
  availability: AvailabilityByEmployee;
  departmentOptions: DepartmentOption[];
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

type CellEditorProps = {
  employeeId: string;
  employeeName: string;
  dayOfWeek: number;
  dayLabel: string;
  slot: AvailabilitySlot | undefined;
  onSaved: () => void;
};

function AvailabilityCellEditor({
  employeeId,
  employeeName,
  dayOfWeek,
  dayLabel,
  slot,
  onSaved,
}: CellEditorProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"menu" | "hours">("menu");
  const [startTime, setStartTime] = useState(
    toInputTime(slot?.start_time ?? null)
  );
  const [endTime, setEndTime] = useState(toInputTime(slot?.end_time ?? null));

  function save(mode: AvailabilityUpdateMode, hours?: { startTime: string; endTime: string }) {
    setError(null);
    startTransition(async () => {
      const result = await upsertEmployeeAvailability(
        employeeId,
        dayOfWeek,
        mode,
        hours
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="space-y-2">
      <PopoverHeader>
        <PopoverTitle className="text-sm">
          {employeeName} · {dayLabel}
        </PopoverTitle>
      </PopoverHeader>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      {view === "menu" ? (
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            className="justify-start font-normal"
            disabled={pending}
            onClick={() => save("all_day")}
          >
            Available all day
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="justify-start font-normal"
            disabled={pending}
            onClick={() => {
              setStartTime(toInputTime(slot?.start_time ?? "09:00:00"));
              setEndTime(toInputTime(slot?.end_time ?? "17:00:00"));
              setView("hours");
            }}
          >
            Set hours
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="justify-start font-normal text-red-600 hover:text-red-700"
            disabled={pending}
            onClick={() => save("unavailable")}
          >
            Unavailable
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`start-${employeeId}-${dayOfWeek}`} className="text-xs">
                Start
              </Label>
              <input
                id={`start-${employeeId}-${dayOfWeek}`}
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={cn(
                  "flex h-9 w-full px-2 text-sm",
                  dashboardFieldInputClass
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`end-${employeeId}-${dayOfWeek}`} className="text-xs">
                End
              </Label>
              <input
                id={`end-${employeeId}-${dayOfWeek}`}
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={cn(
                  "flex h-9 w-full px-2 text-sm",
                  dashboardFieldInputClass
                )}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={pending}
              onClick={() => setView("menu")}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={pending}
              onClick={() => save("hours", { startTime, endTime })}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityCell({
  employee,
  dayOfWeek,
  dayLabel,
  slot,
  onSaved,
}: {
  employee: EmployeeAvailabilityRow;
  dayOfWeek: number;
  dayLabel: string;
  slot: AvailabilitySlot | undefined;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const state = getCellDisplayState(slot);
  const label = cellDisplayLabel(slot);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex min-h-[52px] w-full flex-col items-center justify-center border-l border-[var(--eb-border)] px-2 py-2 text-center text-xs transition-colors hover:bg-[var(--eb-elevated)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)] focus-visible:ring-inset",
              state === "unavailable" &&
                "bg-red-500/10 hover:bg-red-500/15",
              state === "partial" &&
                "bg-[var(--eb-accent)]/5 hover:bg-[var(--eb-accent)]/10",
              state === "available" && "bg-transparent"
            )}
            aria-label={`Edit ${employee.full_name} ${dayLabel} availability`}
          >
            {state === "unavailable" ? (
              <span className="font-medium text-red-600">Unavailable</span>
            ) : state === "partial" ? (
              <span className="font-semibold text-[var(--eb-accent)]">{label}</span>
            ) : null}
          </button>
        }
      />
      <PopoverContent
        align="center"
        className={cn("w-64 p-3", dashboardPopoverContentClass)}
      >
        <AvailabilityCellEditor
          employeeId={employee.id}
          employeeName={employee.full_name}
          dayOfWeek={dayOfWeek}
          dayLabel={dayLabel}
          slot={slot}
          onSaved={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function AvailabilityView({
  employees,
  availability,
  departmentOptions,
  weekStart,
}: AvailabilityViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [departmentId, setDepartmentId] = useState("all");

  const weekMonday = useMemo(() => parseWeekParam(weekStart), [weekStart]);
  const weekLabel = formatWeekRangeLabel(weekMonday);

  const filteredEmployees = useMemo(() => {
    if (departmentId === "all") return employees;
    return employees.filter((e) => e.department_id === departmentId);
  }, [employees, departmentId]);

  function navigateWeek(delta: number) {
    const nextMonday = addWeeks(weekMonday, delta);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", formatWeekParam(nextMonday));
    router.push(`/schedule/availability?${params.toString()}`);
  }

  function handleExport() {
    const subset =
      departmentId === "all"
        ? employees
        : employees.filter((e) => e.department_id === departmentId);
    downloadAvailabilityCsv(
      subset,
      availability,
      `team-availability-${weekStart}.csv`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-[200px] text-center text-sm font-semibold text-[var(--eb-text)]">
            {weekLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-48">
            <Label htmlFor="availabilityDepartment">Department</Label>
            <select
              id="availabilityDepartment"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className={dashboardNativeSelectClass}
            >
              <option value="all">All departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="size-4" aria-hidden />
            Export availability
          </Button>
        </div>
      </div>

      <p className={dashboardPageIntroClass}>
        Set recurring weekly availability. Click a cell to mark unavailable or
        set specific hours.
      </p>

      <Card className={cn("overflow-hidden", dashboardCardClass)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className={dashboardTableHeadRowClass}>
                <th
                  className={cn(
                    dashboardStickyTableCellClass,
                    "w-[200px] min-w-[200px] text-left text-xs font-semibold uppercase tracking-wide text-[var(--eb-muted)]"
                  )}
                >
                  Employee
                </th>
                {GRID_DAYS.map((day) => {
                  const date = dateForDayInWeek(weekMonday, day.dayOfWeek);
                  return (
                    <th
                      key={day.dayOfWeek}
                      className="min-w-[100px] border-l border-[var(--eb-border)] px-2 py-3 text-center"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--eb-text)]">
                        {day.label}
                      </div>
                      <div className="mt-0.5 text-xs font-normal text-[var(--eb-muted)]">
                        {shortDateLabel(date)}
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
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-[var(--eb-muted)]"
                  >
                    No employees match this filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    variants={fadeIn}
                    className="border-b border-[var(--eb-border)] last:border-b-0"
                  >
                    <td
                      className={cn(
                        dashboardStickyTableCellClass,
                        "w-[200px] min-w-[200px]"
                      )}
                    >
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
                          {employee.department ? (
                            <p className="truncate text-xs text-[var(--eb-muted)]">
                              {employee.department}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    {GRID_DAYS.map((day) => (
                      <td key={day.dayOfWeek} className="p-0 align-stretch">
                        <AvailabilityCell
                          employee={employee}
                          dayOfWeek={day.dayOfWeek}
                          dayLabel={day.label}
                          slot={availability[employee.id]?.[day.dayOfWeek]}
                          onSaved={() => router.refresh()}
                        />
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
