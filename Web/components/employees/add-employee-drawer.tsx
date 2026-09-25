"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
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
              <div className="space-y-4">
                {state?.error ? (
                  <p
                    className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    {state.error}
                  </p>
                ) : null}

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
