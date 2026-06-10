"use client";

import { useFormStatus } from "react-dom";
import {
  deactivateEmployee,
  reactivateEmployee,
} from "@/app/(dashboard)/employees/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentOption } from "@/lib/departments/queries";
import { cn } from "@/lib/utils";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

function DeactivateButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? "Processing..." : "Deactivate employee"}
    </Button>
  );
}

type EmployeeDetailFormsProps = {
  employeeId: string;
  defaultValues: {
    fullName: string;
    email: string;
    role: string;
    departmentId: string;
    position: string;
    hireDate: string;
  };
  departmentOptions: DepartmentOption[];
  isActive: boolean;
  updateAction: (formData: FormData) => void;
};

export function EmployeeDetailForms({
  employeeId,
  defaultValues,
  departmentOptions,
  isActive,
  updateAction,
}: EmployeeDetailFormsProps) {
  const deactivateWithId = deactivateEmployee.bind(null, employeeId);
  const reactivateWithId = reactivateEmployee.bind(null, employeeId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Edit employee</h2>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <Input
              id="fullName"
              name="fullName"
              label="Full name"
              required
              defaultValue={defaultValues.fullName}
            />
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              defaultValue={defaultValues.email}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="departmentId">Department</Label>
                <select
                  id="departmentId"
                  name="departmentId"
                  defaultValue={defaultValues.departmentId}
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
              <Input
                id="position"
                name="position"
                label="Position"
                defaultValue={defaultValues.position}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={defaultValues.role}
                  className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  )}
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
                defaultValue={defaultValues.hireDate}
              />
            </div>
            <SaveButton />
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-100">
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Account status</h2>
          <p className="text-sm text-slate-500">
            {isActive
              ? "Deactivate to block kiosk access and hide from active lists."
              : "Reactivate to restore kiosk access."}
          </p>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <form action={deactivateWithId}>
              <DeactivateButton />
            </form>
          ) : (
            <form action={reactivateWithId}>
              <Button type="submit">Reactivate employee</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
