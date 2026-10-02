"use client";

import Box from "@mui/material/Box";

import Stack from "@mui/material/Stack";

import Typography from "@mui/material/Typography";

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

import { Select } from "@/components/ui/select";

import {
  dashboardAlertErrorSx,
  dashboardCardSx,
  dashboardPageIntroSx,
} from "@/lib/dashboard/sx";

import type { DepartmentOption } from "@/lib/departments/queries";

import { employeeInitials } from "@/lib/employees/format";

import { validateCsvFile } from "@/lib/employees/csv-import-limits";

import type { EmployeeListItem } from "@/lib/employees/queries";

type StatusFilter = "all" | "active" | "terminated";

function faceBadge(employee: EmployeeListItem) {
  if (employee.status === "terminated") {
    return (
      <StatusBadge tone="error" theme="dark">
        Deactivated
      </StatusBadge>
    );
  }

  if (employee.needs_reenrollment) {
    return (
      <StatusBadge tone="warning" theme="dark">
        Re-scan needed
      </StatusBadge>
    );
  }

  if (employee.face_registered_at) {
    return (
      <StatusBadge tone="success" theme="dark">
        Enrolled
      </StatusBadge>
    );
  }

  if (employee.hasPin) {
    return (
      <StatusBadge tone="warning" theme="dark">
        PIN only
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone="neutral" theme="dark">
      Pending
    </StatusBadge>
  );
}

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();

  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
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

    [openCsvImport],
  );

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}

      onDragOver={handleDragOver}

      onDragLeave={handleDragLeave}

      onDrop={handleDrop}
    >
      {dragOver ? (
        <Box
          sx={{
            pointerEvents: "none",

            position: "fixed",

            inset: 0,

            zIndex: 50,

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            bgcolor: "rgba(6, 10, 18, 0.7)",

            backdropFilter: "blur(4px)",
          }}

          aria-live="polite"
        >
          <Box
            sx={{
              borderRadius: "16px",

              border: "2px dashed",

              borderColor: "primary.main",

              bgcolor: "background.paper",

              px: 5,

              py: 4,

              textAlign: "center",

              boxShadow: 8,
            }}
          >
            <Upload
              style={{
                margin: "0 auto",
                width: 40,
                height: 40,
                color: "var(--eb-accent)",
              }}

              aria-hidden
            />

            <Typography
              sx={{
                mt: 2,
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "text.primary",
              }}
            >
              Drop CSV to import employees
            </Typography>

            <Typography
              sx={{ mt: 0.5, fontSize: "0.875rem", color: "text.secondary" }}
            >
              We&apos;ll open the import preview when you release the file.
            </Typography>
          </Box>
        </Box>
      ) : null}

      {dropError ? (
        <Box component="p" role="alert" sx={dashboardAlertErrorSx}>
          {dropError}
        </Box>
      ) : null}

      <Stack
        direction="row"

        useFlexGap

        sx={{
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography component="p" sx={dashboardPageIntroSx}>
          Manage your team roster, kiosk access, and profiles.
        </Typography>

        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
          <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />

          <AddEmployeeTrigger onClick={() => setDrawerOpen(true)} />
        </Stack>
      </Stack>

      <DashboardTabs
        tabs={statusTabs}

        value={statusFilter}

        onChange={setStatusFilter}
      />

      {employees.length === 0 ? (
        <Card
          sx={{
            ...dashboardCardSx,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            textAlign: "center",
            ...(dragOver
              ? {
                  borderColor: "primary.main",
                  boxShadow: (theme) =>
                    `0 0 0 2px ${theme.palette.primary.main}4D`,
                }
              : {}),
          }}
        >
          <Box
            sx={{
              display: "flex",

              width: 64,

              height: 64,

              alignItems: "center",

              justifyContent: "center",

              borderRadius: "16px",

              border: "1px solid",

              borderColor: "divider",

              bgcolor: "secondary.main",

              color: "primary.main",
            }}
          >
            <Users style={{ width: 32, height: 32 }} aria-hidden />
          </Box>

          <Typography
            component="h2"

            sx={{
              mt: 3,
              fontSize: "1.125rem",
              fontWeight: 500,
              color: "text.primary",
            }}
          >
            Add your first team member
          </Typography>

          <Typography
            sx={{
              mt: 1,
              maxWidth: 384,
              fontSize: "0.875rem",
              color: "text.secondary",
            }}
          >
            Create a profile and we&apos;ll generate a kiosk PIN for clock-in.
            Or drag a CSV anywhere on this page to import.
          </Typography>

          <Stack
            direction="row"
            useFlexGap
            sx={{ mt: 3, flexWrap: "wrap", justifyContent: "center", gap: 1 }}
          >
            <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />

            <AddEmployeeTrigger onClick={() => setDrawerOpen(true)} />
          </Stack>
        </Card>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}

            useFlexGap

            sx={{ gap: 2, alignItems: { sm: "flex-end" } }}
          >
            <Box sx={{ flex: 1 }}>
              <Input
                id="employeeSearch"

                label="Search"

                placeholder="Search by name or email..."

                value={search}

                onChange={(event) => setSearch(event.target.value)}
              />
            </Box>

            <Box sx={{ width: { xs: "100%", sm: 192 } }}>
              <Select
                id="departmentFilter"
                label="Department"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                displayEmpty={false}
                options={[
                  { value: "all", label: "All departments" },
                  ...departmentOptions.map((dept) => ({
                    value: dept.id,
                    label: dept.name,
                  })),
                ]}
              />
            </Box>
          </Stack>

          <Card sx={{ ...dashboardCardSx, overflow: "hidden" }}>
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Employee</DataTableHead>

                  <DataTableHead>Department</DataTableHead>

                  <DataTableHead>Position</DataTableHead>

                  <DataTableHead>Status</DataTableHead>

                  <DataTableHead>PIN</DataTableHead>

                  <DataTableHead>Face</DataTableHead>

                  <DataTableHead align="right">Actions</DataTableHead>
                </DataTableRow>
              </DataTableHeader>

              <DataTableBody>
                {filtered.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={7}>
                      <DataTableEmpty>
                        No employees match your filters.
                      </DataTableEmpty>
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  filtered.map((employee) => {
                    const terminated = employee.status === "terminated";

                    return (
                      <DataTableRow
                        key={employee.id}

                        sx={terminated ? { opacity: 0.7 } : undefined}
                      >
                        <DataTableCell>
                          <Stack
                            direction="row"
                            useFlexGap
                            sx={{ alignItems: "center", gap: 1.5 }}
                          >
                            <Box
                              sx={{
                                display: "flex",

                                width: 36,

                                height: 36,

                                flexShrink: 0,

                                alignItems: "center",

                                justifyContent: "center",

                                borderRadius: "50%",

                                fontSize: "0.75rem",

                                fontWeight: 700,

                                ...(terminated
                                  ? {
                                      bgcolor: "action.hover",

                                      color: "text.secondary",
                                    }
                                  : {
                                      border: "1px solid",

                                      borderColor: "divider",

                                      bgcolor: "secondary.main",

                                      color: "primary.main",
                                    }),
                              }}
                            >
                              {employeeInitials(employee.full_name)}
                            </Box>

                            <Box>
                              <Box
                                component={Link}

                                href={`/employees/${employee.id}`}

                                sx={{
                                  fontWeight: 500,

                                  textDecoration: terminated
                                    ? "line-through"
                                    : "none",

                                  color: terminated
                                    ? "text.secondary"
                                    : "text.primary",

                                  "&:hover": { color: "primary.main" },
                                }}
                              >
                                {employee.full_name}
                              </Box>

                              {employee.email ? (
                                <Typography
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: "text.secondary",
                                  }}
                                >
                                  {employee.email}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        </DataTableCell>

                        <DataTableCell>
                          {employee.department ?? "—"}
                        </DataTableCell>

                        <DataTableCell>
                          {employee.position ?? "—"}
                        </DataTableCell>

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

                        <DataTableCell align="right">
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
    </Box>
  );
}
