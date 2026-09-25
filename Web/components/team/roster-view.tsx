"use client";

import { Upload, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  AddEmployeeDrawer,
  AddEmployeeTrigger,
} from "@/components/employees/add-employee-drawer";
import {
  ImportEmployeesDialog,
  ImportEmployeesTrigger,
  type CsvImportSeed,
} from "@/components/employees/import-employees-dialog";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { RosterRowActions } from "@/components/team/roster-row-actions";
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
import {
  dashboardCardClass,
  dashboardNativeSelectClass,
  dashboardPageIntroClass,
} from "@/lib/dashboard/styles";
import type { DepartmentOption } from "@/lib/departments/queries";
import { employeeInitials } from "@/lib/employees/format";
import { validateCsvFile } from "@/lib/employees/csv-import-limits";
import type { EmployeeListItem } from "@/lib/employees/queries";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "terminated";

function faceBadge(employee: EmployeeListItem) {
  if (employee.status === "terminated") {
    return <StatusBadge tone="error" theme="dark">Deactivated</StatusBadge>;
  }
  if (employee.needs_reenrollment) {
    return <StatusBadge tone="warning" theme="dark">Re-scan needed</StatusBadge>;
  }
  if (employee.face_registered_at) {
    return <StatusBadge tone="success" theme="dark">Enrolled</StatusBadge>;
  }
  if (employee.hasPin) {
    return <StatusBadge tone="warning" theme="dark">PIN only</StatusBadge>;
  }
  return <StatusBadge tone="neutral" theme="dark">Pending</StatusBadge>;
}

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel";
}

type RosterViewProps = {
  employees: EmployeeListItem[];
  departmentOptions: DepartmentOption[];
};

export function RosterView({ employees, departmentOptions }: RosterViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvSeed, setCsvSeed] = useState<CsvImportSeed | null>(null);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

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

  const statusTabs = [
    { id: "all" as const, label: "All" },
    { id: "active" as const, label: "Active" },
    { id: "terminated" as const, label: "Terminated" },
  ];

  const openCsvImport = useCallback((text: string, fileName: string) => {
    setDropError(null);
    setCsvSeed({ text, fileName });
    setImportOpen(true);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (!file || !isCsvFile(file)) return;
      const fileError = validateCsvFile(file);
      if (fileError) {
        setDropError(fileError);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        openCsvImport(String(reader.result ?? ""), file.name);
      };
      reader.readAsText(file);
    },
    [openCsvImport]
  );

  return (
    <div
      className="relative space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragOver ? (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--eb-ink)]/70 backdrop-blur-sm"
          aria-live="polite"
        >
          <div className="rounded-2xl border-2 border-dashed border-[var(--eb-accent)] bg-[var(--eb-surface)] px-10 py-8 text-center shadow-xl">
            <Upload className="mx-auto size-10 text-[var(--eb-accent)]" aria-hidden />
            <p className="mt-4 text-lg font-medium text-[var(--eb-text)]">
              Drop CSV to import employees
            </p>
            <p className="mt-1 text-sm text-[var(--eb-muted)]">
              We&apos;ll open the import preview when you release the file.
            </p>
          </div>
        </div>
      ) : null}

      {dropError ? (
        <p
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          {dropError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className={dashboardPageIntroClass}>
          Manage your team roster, kiosk access, and profiles.
        </p>
        <div className="flex flex-wrap gap-2">
          <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />
          <AddEmployeeTrigger onClick={() => setDrawerOpen(true)} />
        </div>
      </div>

      <DashboardTabs
        tabs={statusTabs}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      {employees.length === 0 ? (
        <Card
          className={cn(
            dashboardCardClass,
            "flex flex-col items-center justify-center py-16 text-center",
            dragOver && "border-[var(--eb-accent)] ring-2 ring-[var(--eb-accent)]/30"
          )}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-accent)]">
            <Users className="size-8" aria-hidden />
          </div>
          <h2 className="mt-6 text-lg font-medium text-[var(--eb-text)]">
            Add your first team member
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--eb-muted)]">
            Create a profile and we&apos;ll generate a kiosk PIN for clock-in. Or
            drag a CSV anywhere on this page to import.
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
              <Label htmlFor="departmentFilter" className="text-[var(--eb-text)]">
                Department
              </Label>
              <select
                id="departmentFilter"
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
          </div>

          <Card className={cn(dashboardCardClass, "overflow-hidden")}>
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
                      <DataTableEmpty>
                        No employees match your filters.
                      </DataTableEmpty>
                    </td>
                  </tr>
                ) : (
                  filtered.map((employee) => {
                    const terminated = employee.status === "terminated";
                    return (
                      <DataTableRow
                        key={employee.id}
                        className={cn(terminated && "opacity-70")}
                      >
                        <DataTableCell>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                terminated
                                  ? "bg-[var(--eb-hover-overlay)] text-[var(--eb-muted)]"
                                  : "border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-accent)]"
                              )}
                            >
                              {employeeInitials(employee.full_name)}
                            </span>
                            <div>
                              <Link
                                href={`/employees/${employee.id}`}
                                className={cn(
                                  "font-medium hover:text-[var(--eb-accent)]",
                                  terminated
                                    ? "text-[var(--eb-muted)] line-through"
                                    : "text-[var(--eb-text)]"
                                )}
                              >
                                {employee.full_name}
                              </Link>
                              {employee.email ? (
                                <p className="text-xs text-[var(--eb-muted)]">
                                  {employee.email}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>{employee.department ?? "—"}</DataTableCell>
                        <DataTableCell>{employee.position ?? "—"}</DataTableCell>
                        <DataTableCell>
                          {terminated ? (
                            <StatusBadge tone="error" theme="dark">
                              Deactivated
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone="success" theme="dark">
                              Active
                            </StatusBadge>
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
      <ImportEmployeesDialog
        open={importOpen}
        onOpenChange={(open) => {
          if (!open) setCsvSeed(null);
          setImportOpen(open);
        }}
        csvSeed={csvSeed}
      />
    </div>
  );
}
