"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createScheduleShift } from "@/app/(dashboard)/schedule/schedule/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DepartmentWithRoles } from "@/lib/departments/queries";
import type { ScheduleEmployeeRow } from "@/lib/schedules/queries";
import {
  dashboardPageIntroClass,
  dashboardSectionTitleClass,
  dashboardSheetContentClass,
  dashboardSheetOverlayClass,
} from "@/lib/dashboard/styles";
import { SHIFT_PRESET_COLORS } from "@/lib/schedules/format";
import { cn } from "@/lib/utils";

export type AddShiftContext = {
  employeeId: string | null;
  isOpenShift: boolean;
  shiftDate: string;
  employeeName?: string;
};

type AddShiftSheetProps = {
  open: boolean;
  onClose: () => void;
  context: AddShiftContext | null;
  employees: ScheduleEmployeeRow[];
  departments: DepartmentWithRoles[];
  onSaved: () => void;
};

export function AddShiftSheet({
  open,
  onClose,
  context,
  employees,
  departments,
  onSaved,
}: AddShiftSheetProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState<string>(SHIFT_PRESET_COLORS[0]);

  const isOpenShift = context?.isOpenShift ?? false;

  const rolesForDepartment = useMemo(() => {
    if (!departmentId) return [];
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.roles ?? [];
  }, [departmentId, departments]);

  function resetFromContext() {
    if (!context) return;
    setEmployeeId(context.employeeId ?? "");
    setStartTime("09:00");
    setEndTime("17:00");
    setDepartmentId("");
    setRoleId("");
    setNotes("");
    setColor(SHIFT_PRESET_COLORS[0]);
    setError(null);
  }

  useEffect(() => {
    if (open && context) resetFromContext();
  }, [open, context]);

  function submit(status: "draft" | "published") {
    if (!context) return;
    const resolvedEmployeeId = isOpenShift ? null : employeeId || context.employeeId;
    if (!isOpenShift && !resolvedEmployeeId) {
      setError("Please select an employee.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createScheduleShift({
        employeeId: resolvedEmployeeId,
        isOpenShift,
        shiftDate: context.shiftDate,
        startTime,
        endTime,
        departmentId: departmentId || null,
        roleId: roleId || null,
        notes,
        color,
        status,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      onSaved();
    });
  }

  const dateLabel = context
    ? new Date(`${context.shiftDate}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) resetFromContext();
        else onClose();
      }}
    >
      <SheetContent
        variant="dashboard"
        side="right"
        overlayClassName={dashboardSheetOverlayClass}
        className={cn(
          dashboardSheetContentClass,
          "flex h-full w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        )}
      >
        <SheetHeader className="shrink-0 border-b border-[var(--eb-border)] px-6 pb-5 pt-6 pr-14">
          <SheetTitle className={dashboardSectionTitleClass}>Add shift</SheetTitle>
          <SheetDescription className={dashboardPageIntroClass}>
            {isOpenShift
              ? "Open shift — assign an employee later."
              : context?.employeeName
                ? `For ${context.employeeName}`
                : "Create a new shift"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-6 py-5 pb-8">
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          {!isOpenShift ? (
            <Select
              id="shiftEmployee"
              label="Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              emptyLabel="Select employee"
              options={employees.map((emp) => ({
                value: emp.id,
                label: emp.full_name,
              }))}
            />
          ) : null}

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[var(--eb-text)]">Date</p>
            <p className="text-sm font-medium text-[var(--eb-text)]">{dateLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="shiftStart"
              label="Start time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              id="shiftEnd"
              label="End time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="shiftDepartment"
              label="Department"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setRoleId("");
              }}
              options={[
                { value: "", label: "None" },
                ...departments.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })),
              ]}
            />
            <Select
              id="shiftRole"
              label="Role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={!departmentId}
              options={[
                { value: "", label: "None" },
                ...rolesForDepartment.map((role) => ({
                  value: role.id,
                  label: role.name,
                })),
              ]}
            />
          </div>

          <Textarea
            id="shiftNotes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--eb-text)]">Color</p>
            <div className="flex flex-wrap gap-2">
              {SHIFT_PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={cn(
                    "size-8 rounded-full ring-2 ring-offset-2 transition",
                    color === preset ? "ring-[var(--eb-accent)]" : "ring-transparent"
                  )}
                  style={{ backgroundColor: preset }}
                  onClick={() => setColor(preset)}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-[var(--eb-border)] px-6 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={() => submit("draft")}
          >
            Save as Draft
          </Button>
          <PendingButton
            type="button"
            className="flex-1"
            pending={pending}
            pendingLabel="Saving…"
            onClick={() => submit("published")}
          >
            Publish now
          </PendingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
