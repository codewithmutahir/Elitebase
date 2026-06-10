"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { addEmployee, type AddEmployeeState } from "@/app/(dashboard)/employees/actions";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentOption } from "@/lib/departments/queries";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

  return (
    <Sheet
      open={open || Boolean(state?.plainPin)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent side="right" className="w-full max-w-md sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add employee</SheetTitle>
          <SheetDescription>
            A 4-digit kiosk PIN is generated automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {state?.plainPin ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden />
                <h3 className="font-semibold">Employee added — save this PIN</h3>
              </div>
              <p className="mt-2 text-sm text-emerald-700">
                {state.employeeName} was created. Share this PIN for kiosk clock-in
                (shown once).
              </p>
              <p className="mt-4 font-mono text-4xl font-bold tracking-widest text-emerald-800">
                {state.plainPin}
              </p>
              {state.employeeId ? (
                <ButtonLink
                  href={`/employees/${state.employeeId}`}
                  variant="link"
                  className="mt-4 h-auto p-0"
                >
                  View profile →
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              {state?.error ? (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </p>
              ) : null}

              <Input id="fullName" name="fullName" label="Full name" required />
              <Input id="email" name="email" label="Email" type="email" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    defaultValue=""
                    className={cn(
                      "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    )}
                  >
                    <option value="">None</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input id="position" name="position" label="Position" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="employee"
                    className={cn(
                      "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    )}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <Input id="hireDate" name="hireDate" label="Hire date" type="date" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Adding..." : "Add employee"}
                </Button>
              </div>
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
