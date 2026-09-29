"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";
import { addEmployee, type AddEmployeeState } from "@/app/(dashboard)/employees/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DepartmentOption } from "@/lib/departments/queries";
import {
  dashboardFieldInputClass,
  dashboardNativeSelectClass,
  dashboardPageIntroClass,
  dashboardPinDisplayClass,
  dashboardSectionTitleClass,
  dashboardSheetContentClass,
  dashboardSheetOverlayClass,
  dashboardSheetSuccessPanelClass,
} from "@/lib/dashboard/styles";
import {
  ALL_ISO_DAYS,
  ISO_DAY_LABELS,
  normalizeWorkingDays,
} from "@/lib/employees/working-days";
import { cn } from "@/lib/utils";

const initialState: AddEmployeeState | null = null;

type AddEmployeeDrawerProps = {
  open: boolean;
  onClose: () => void;
  departmentOptions: DepartmentOption[];
};

export function AddEmployeeDrawer({
  open,
  onClose,
  departmentOptions,
}: AddEmployeeDrawerProps) {
  const [state, formAction, pending] = useActionState(addEmployee, initialState);
  const showSuccess = Boolean(state?.plainPin);
  const [payType, setPayType] = useState<"hourly" | "salary">("hourly");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  function toggleDay(day: number) {
    setWorkingDays((prev) => {
      const normalized = normalizeWorkingDays(prev);
      if (normalized.includes(day)) {
        const next = normalized.filter((d) => d !== day);
        return next.length > 0 ? next : normalized;
      }
      return normalizeWorkingDays([...normalized, day]);
    });
  }

  return (
    <Sheet
      open={open || showSuccess}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
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
        <SheetHeader className="shrink-0 border-b border-[var(--eb-border)] px-6 py-5 pr-14">
          <SheetTitle className={dashboardSectionTitleClass}>
            {showSuccess ? "Kiosk PIN ready" : "Add employee"}
          </SheetTitle>
          <SheetDescription className={dashboardPageIntroClass}>
            {showSuccess
              ? "Copy or share this PIN now — it won’t be shown again."
              : "A 4-digit kiosk PIN is generated automatically after you save."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
          {showSuccess ? (
            <div className="flex flex-1 flex-col">
              <div className={dashboardSheetSuccessPanelClass}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-12 items-center justify-center rounded-full border border-[var(--eb-accent)]/35 bg-[var(--eb-accent)]/10">
                    <CheckCircle2
                      className="size-6 text-[var(--eb-accent)]"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--eb-text)]">
                    {state?.employeeName} was added
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-[var(--eb-muted)]">
                    Use this PIN for on-site kiosk clock-in.
                  </p>
                  <p
                    className={cn("mt-8", dashboardPinDisplayClass)}
                    aria-label={`Kiosk PIN ${state?.plainPin}`}
                  >
                    {state?.plainPin}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {state?.employeeId ? (
                  <ButtonLink
                    href={`/employees/${state.employeeId}`}
                    variant="default"
                    className="w-full"
                  >
                    View profile
                  </ButtonLink>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[var(--eb-border)] bg-transparent text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form action={formAction} className="flex min-h-0 flex-1 flex-col">
              <input type="hidden" name="workingDays" value={JSON.stringify(workingDays)} />
              <div className="space-y-5">
                {state?.error ? (
                  <p
                    className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    {state.error}
                  </p>
                ) : null}

                {/* — Basic info — */}
                <Input
                  id="fullName"
                  name="fullName"
                  label="Full name"
                  required
                  className={dashboardFieldInputClass}
                />
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  className={dashboardFieldInputClass}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      defaultValue=""
                      className={cn(dashboardNativeSelectClass, "mt-1.5")}
                    >
                      <option value="">None</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    id="position"
                    name="position"
                    label="Position"
                    className={dashboardFieldInputClass}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="role"
                      defaultValue="employee"
                      className={cn(dashboardNativeSelectClass, "mt-1.5")}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <Input
                    id="hireDate"
                    name="hireDate"
                    label="Hire date"
                    type="date"
                    className={dashboardFieldInputClass}
                  />
                </div>

                {/* — Schedule — */}
                <div className="rounded-lg border border-[var(--eb-border)] p-4 space-y-3">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Schedule</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="scheduleStartTime">Shift start</Label>
                      <input
                        id="scheduleStartTime"
                        name="scheduleStartTime"
                        type="time"
                        defaultValue="09:00"
                        className={cn(dashboardFieldInputClass, "mt-1.5")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduleEndTime">Shift end</Label>
                      <input
                        id="scheduleEndTime"
                        name="scheduleEndTime"
                        type="time"
                        defaultValue="17:00"
                        className={cn(dashboardFieldInputClass, "mt-1.5")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Working days</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {ALL_ISO_DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            normalizeWorkingDays(workingDays).includes(day)
                              ? "bg-[var(--eb-accent)] text-white"
                              : "border border-[var(--eb-border)] bg-transparent text-[var(--eb-muted)] hover:text-[var(--eb-text)]"
                          )}
                        >
                          {ISO_DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-[var(--eb-muted)]">
                      Unselected days are off days
                    </p>
                  </div>
                </div>

                {/* — Pay — */}
                <div className="rounded-lg border border-[var(--eb-border)] p-4 space-y-3">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Compensation</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="payType">Pay type</Label>
                      <select
                        id="payType"
                        name="payType"
                        value={payType}
                        onChange={(e) => setPayType(e.target.value as "hourly" | "salary")}
                        className={cn(dashboardNativeSelectClass, "mt-1.5")}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="salary">Monthly salary</option>
                      </select>
                    </div>
                    {payType === "salary" ? (
                      <Input
                        id="salaryAmount"
                        name="salaryAmount"
                        label="Monthly salary"
                        type="number"
                        min="0"
                        step="0.01"
                        className={dashboardFieldInputClass}
                      />
                    ) : null}
                  </div>
                </div>

                {/* — Bonus — */}
                <div className="rounded-lg border border-[var(--eb-border)] p-4 space-y-3">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Bonus</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="bonusAmount"
                      name="bonusAmount"
                      label="Amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={dashboardFieldInputClass}
                    />
                    <Input
                      id="bonusNote"
                      name="bonusNote"
                      label="Note"
                      placeholder="Signing bonus, performance…"
                      className={dashboardFieldInputClass}
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-auto flex shrink-0 flex-row gap-3 border-0 px-0 pt-8 pb-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-[var(--eb-border)] bg-transparent text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
                >
                  Cancel
                </Button>
                <PendingButton
                  type="submit"
                  pending={pending}
                  pendingLabel="Adding…"
                  className="flex-1"
                >
                  Add employee
                </PendingButton>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AddEmployeeTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button type="button" onClick={onClick}>
      Add employee
    </Button>
  );
}
