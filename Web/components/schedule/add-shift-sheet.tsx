"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createScheduleShift } from "@/app/(dashboard)/schedule/schedule/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      <SheetContent side="right" className="w-full max-w-md sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add shift</SheetTitle>
          <SheetDescription>
            {isOpenShift
              ? "Open shift — assign an employee later."
              : context?.employeeName
                ? `For ${context.employeeName}`
                : "Create a new shift"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!isOpenShift ? (
            <div className="space-y-1.5">
              <Label htmlFor="shiftEmployee">Employee</Label>
              <select
                id="shiftEmployee"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Date</Label>
            <p className="text-sm font-medium text-slate-900">{dateLabel}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shiftStart">Start time</Label>
              <input
                id="shiftStart"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shiftEnd">End time</Label>
              <input
                id="shiftEnd"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shiftDepartment">Department</Label>
              <select
                id="shiftDepartment"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setRoleId("");
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shiftRole">Role</Label>
              <select
                id="shiftRole"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                disabled={!departmentId}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="">None</option>
                {rolesForDepartment.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shiftNotes">Notes (optional)</Label>
            <textarea
              id="shiftNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SHIFT_PRESET_COLORS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={cn(
                    "size-8 rounded-full ring-2 ring-offset-2 transition",
                    color === preset ? "ring-blue-600" : "ring-transparent"
                  )}
                  style={{ backgroundColor: preset }}
                  onClick={() => setColor(preset)}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={() => submit("draft")}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={pending}
            onClick={() => submit("published")}
          >
            Publish now
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
