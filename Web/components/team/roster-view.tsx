"use client";

import { Users } from "lucide-react";
import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { RosterRowActions } from "@/components/team/roster-row-actions";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AddEmployeeDrawer,
  AddEmployeeTrigger,
} from "@/components/employees/add-employee-drawer";
import {
  ImportEmployeesDialog,
  ImportEmployeesTrigger,
} from "@/components/employees/import-employees-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentOption } from "@/lib/departments/queries";
import { employeeInitials } from "@/lib/employees/format";
import type { EmployeeListItem } from "@/lib/employees/queries";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "terminated";

function faceBadge(employee: EmployeeListItem) {
  if (employee.status === "terminated") {
    return <StatusBadge tone="error">Deactivated</StatusBadge>;
  }
  if (employee.needs_reenrollment) {
    return <StatusBadge tone="warning">Re-scan needed</StatusBadge>;
  }
  if (employee.face_registered_at) {
    return <StatusBadge tone="success">Enrolled</StatusBadge>;
  }
  if (employee.hasPin) {
    return <StatusBadge tone="warning">PIN only</StatusBadge>;
  }
  return <StatusBadge tone="neutral">Pending</StatusBadge>;
}

type RosterViewProps = {
  employees: EmployeeListItem[];
  departmentOptions: DepartmentOption[];
};

export function RosterView({ employees, departmentOptions }: RosterViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter !== "all" && employee.status !== statusFilter) {
        return false;
      }
      if (departmentId !== "all" && employee.department_id !== departmentId) {
        return false;
      }
      if (!q) return true;
      return (
        employee.full_name.toLowerCase().includes(q) ||
        (employee.email?.toLowerCase().includes(q) ?? false) ||
        (employee.department?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [employees, search, departmentId, statusFilter]);

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "terminated", label: "Terminated" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-sm text-slate-500">
          Manage your team roster, kiosk access, and profiles.
        </p>
        <div className="flex flex-wrap gap-2">
          <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />
          <AddEmployeeTrigger onClick={() => setDrawerOpen(true)} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
              statusFilter === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {employees.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users className="size-8" aria-hidden />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-slate-900">
            Add your first team member
          </h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Create a profile and we&apos;ll generate a kiosk PIN for clock-in.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />
            <AddEmployeeTrigger onClick={() => setDrawerOpen(true)} />
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                id="employeeSearch"
                label="Search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="departmentFilter">Department</Label>
              <select
                id="departmentFilter"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Card className="overflow-hidden">
            <DataTable>
              <DataTableHeader>
                <tr>
                  <DataTableHead>Employee</DataTableHead>
                  <DataTableHead>Department</DataTableHead>
                  <DataTableHead>Position</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>PIN</DataTableHead>
                  <DataTableHead>Face</DataTableHead>
                  <DataTableHead className="text-right">Actions</DataTableHead>
                </tr>
              </DataTableHeader>
              <DataTableBody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <DataTableEmpty>No employees match your filters.</DataTableEmpty>
                    </td>
                  </tr>
                ) : (
                  filtered.map((employee) => {
                    const terminated = employee.status === "terminated";
                    return (
                      <DataTableRow
                        key={employee.id}
                        className={cn(terminated && "bg-slate-50/80 opacity-75")}
                      >
                        <DataTableCell>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                terminated
                                  ? "bg-slate-200 text-slate-500"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {employeeInitials(employee.full_name)}
                            </span>
                            <div>
                              <Link
                                href={`/employees/${employee.id}`}
                                className={cn(
                                  "font-semibold hover:text-blue-600",
                                  terminated
                                    ? "text-slate-500 line-through"
                                    : "text-slate-900"
                                )}
                              >
                                {employee.full_name}
                              </Link>
                              {employee.email ? (
                                <p className="text-xs text-slate-500">{employee.email}</p>
                              ) : null}
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>{employee.department ?? "—"}</DataTableCell>
                        <DataTableCell>{employee.position ?? "—"}</DataTableCell>
                        <DataTableCell>
                          {terminated ? (
                            <StatusBadge tone="error">Deactivated</StatusBadge>
                          ) : (
                            <StatusBadge tone="success">Active</StatusBadge>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <RosterPinCell
                            employeeId={employee.id}
                            hasPin={employee.hasPin}
                            pin={employee.pin}
                          />
                        </DataTableCell>
                        <DataTableCell>{faceBadge(employee)}</DataTableCell>
                        <DataTableCell className="text-right">
                          <RosterRowActions employee={employee} />
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })
                )}
              </DataTableBody>
            </DataTable>
          </Card>
        </>
      )}

      <AddEmployeeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        departmentOptions={departmentOptions}
      />
      <ImportEmployeesDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
