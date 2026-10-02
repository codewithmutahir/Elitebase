"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";
import { addEmployee, type AddEmployeeState } from "@/app/(dashboard)/employees/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
        <SheetHeader className="shrink-0 border-b border-[var(--eb-border)] px-6 pb-5 pt-6 pr-14">
          <SheetTitle className={dashboardSectionTitleClass}>
            {showSuccess ? "Kiosk PIN ready" : "Add employee"}
          </SheetTitle>
          <SheetDescription className={dashboardPageIntroClass}>
            {showSuccess
              ? "Copy or share this PIN now — it won’t be shown again."
              : "A 4-digit kiosk PIN is generated automatically after you save."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 pb-8">
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
              <div className="space-y-6">
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
                />
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id="departmentId"
                    name="departmentId"
                    label="Department"
                    defaultValue=""
                    options={[
                      { value: "", label: "None" },
                      ...departmentOptions.map((dept) => ({
                        value: dept.id,
                        label: dept.name,
                      })),
                    ]}
                  />
                  <Input id="position" name="position" label="Position" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id="role"
                    name="role"
                    label="Role"
                    defaultValue="employee"
                    displayEmpty={false}
                    options={[
                      { value: "employee", label: "Employee" },
                      { value: "manager", label: "Manager" },
                    ]}
                  />
                  <Input
                    id="hireDate"
                    name="hireDate"
                    label="Hire date"
                    type="date"
                  />
                </div>

                {/* — Schedule — */}
                <div className="space-y-4 rounded-lg border border-[var(--eb-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Schedule</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      id="scheduleStartTime"
                      name="scheduleStartTime"
                      label="Shift start"
                      type="time"
                      defaultValue="09:00"
                      className="min-w-0"
                    />
                    <Input
                      id="scheduleEndTime"
                      name="scheduleEndTime"
                      label="Shift end"
                      type="time"
                      defaultValue="17:00"
                      className="min-w-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--eb-text)]">
                      Working days
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                <div className="space-y-4 rounded-lg border border-[var(--eb-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Compensation</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                      id="payType"
                      name="payType"
                      label="Pay type"
                      value={payType}
                      onChange={(e) =>
                        setPayType(e.target.value as "hourly" | "salary")
                      }
                      displayEmpty={false}
                      options={[
                        { value: "hourly", label: "Hourly" },
                        { value: "salary", label: "Monthly salary" },
                      ]}
                    />
                    {payType === "salary" ? (
                      <Input
                        id="salaryAmount"
                        name="salaryAmount"
                        label="Monthly salary"
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    ) : null}
                  </div>
                </div>

                {/* — Bonus — */}
                <div className="space-y-4 rounded-lg border border-[var(--eb-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--eb-text)]">Bonus</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      id="bonusAmount"
                      name="bonusAmount"
                      label="Amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <Input
                      id="bonusNote"
                      name="bonusNote"
                      label="Note"
                      placeholder="Signing bonus, performance…"
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-auto flex shrink-0 flex-row gap-3 border-0 px-0 pt-6 pb-2">
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
