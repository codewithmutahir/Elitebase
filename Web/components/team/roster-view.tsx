"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Filter, Plus, Search, Upload, Users } from "lucide-react";
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
import { RosterRowActions } from "@/components/team/roster-row-actions";
import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/ui/status-badge";
import {
  dashboardAlertErrorSx,
  dashboardCardSx,
  dashboardErrorLinkSx,
  dashboardMutedLinkSx,
  dashboardPageIntroSx,
} from "@/lib/dashboard/sx";
import type { DepartmentOption } from "@/lib/departments/queries";
import { validateCsvFile } from "@/lib/employees/csv-import-limits";
import { employeeInitials } from "@/lib/employees/format";
import type { EmployeeListItem } from "@/lib/employees/queries";
import {
  formatAccessLevel,
  getRosterOnboardingStatus,
  rosterStatusLabel,
  rosterStatusTone,
} from "@/lib/employees/roster-status";
import {
  formatHourlyRate,
  formatMonthlySalary,
} from "@/lib/money/format";

function isCsvFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"
  );
}

function profileHref(employeeId: string, tab: string) {
  return `/employees/${employeeId}#${tab}`;
}

function formatWage(employee: EmployeeListItem, currency: string | null) {
  if (employee.pay_type === "salary" && employee.salary_amount != null) {
    return formatMonthlySalary(employee.salary_amount, currency);
  }
  if (employee.hourly_rate > 0) {
    return formatHourlyRate(employee.hourly_rate, currency);
  }
  return null;
}

const addContactLinkSx = {
  ...dashboardErrorLinkSx,
  display: "inline",
  fontSize: "0.8125rem",
  cursor: "pointer",
};

const addOptionalLinkSx = {
  ...dashboardMutedLinkSx,
  display: "inline",
  fontSize: "0.8125rem",
  cursor: "pointer",
};

type RosterViewProps = {
  employees: EmployeeListItem[];
  departmentOptions: DepartmentOption[];
  currency: string | null;
  /** leave year remaining/allotted, e.g. "10/12" */
  leaveRemainingByEmployeeId?: Record<string, string>;
};

export function RosterView({
  employees,
  departmentOptions,
  currency,
  leaveRemainingByEmployeeId = {},
}: RosterViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvSeed, setCsvSeed] = useState<CsvImportSeed | null>(null);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [showTerminated, setShowTerminated] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (!showTerminated && employee.status === "terminated") return false;
      if (departmentId !== "all" && employee.department_id !== departmentId) {
        return false;
      }
      if (!q) return true;
      return (
        employee.full_name.toLowerCase().includes(q) ||
        (employee.email?.toLowerCase().includes(q) ?? false) ||
        (employee.phone?.toLowerCase().includes(q) ?? false) ||
        (employee.department?.toLowerCase().includes(q) ?? false) ||
        (employee.position?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [employees, search, departmentId, showTerminated]);

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

  const filterActive = departmentId !== "all";

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
          Manage your team roster, contact info, and portal invites.
        </Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
          <ImportEmployeesTrigger onClick={() => setImportOpen(true)} />
          <AddEmployeeTrigger onClick={() => setDrawerOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add team member
          </AddEmployeeTrigger>
        </Stack>
      </Stack>

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
            <AddEmployeeTrigger onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Add team member
            </AddEmployeeTrigger>
          </Stack>
        </Card>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            useFlexGap
            sx={{
              gap: 2,
              alignItems: { md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ position: "relative", flex: 1, maxWidth: { md: 360 } }}>
              <Box
                sx={{
                  pointerEvents: "none",
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  zIndex: 1,
                  display: "flex",
                  transform: "translateY(-50%)",
                  color: "text.secondary",
                }}
              >
                <Search style={{ width: 16, height: 16 }} aria-hidden />
              </Box>
              <Input
                id="employeeSearch"
                placeholder="Search team members…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </Box>

            <Stack
              direction="row"
              useFlexGap
              sx={{
                flexWrap: "wrap",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                }}
              >
                {filtered.length} team member
                {filtered.length === 1 ? "" : "s"}
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={showTerminated}
                    onChange={(_, checked) => setShowTerminated(checked)}
                    color="primary"
                  />
                }
                label="Show terminated"
                sx={{
                  m: 0,
                  ml: 0.5,
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.875rem",
                    color: "text.secondary",
                  },
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-[var(--eb-border)] bg-transparent text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
                onClick={(event) => setFilterAnchor(event.currentTarget)}
                aria-expanded={Boolean(filterAnchor)}
              >
                <Filter className="size-3.5" aria-hidden />
                Filter
                {filterActive ? (
                  <Box
                    component="span"
                    sx={{
                      ml: 0.25,
                      borderRadius: 999,
                      bgcolor: "primary.main",
                      px: 0.75,
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#060A12",
                    }}
                  >
                    1
                  </Box>
                ) : null}
              </Button>

              <Popover
                open={Boolean(filterAnchor)}
                anchorEl={filterAnchor}
                onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      width: 280,
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    },
                  },
                }}
              >
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
                {filterActive ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full justify-center text-[var(--eb-muted)]"
                    onClick={() => setDepartmentId("all")}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </Popover>
            </Stack>
          </Stack>

          <Card sx={{ ...dashboardCardSx, overflow: "hidden" }}>
            <DataTable size="small">
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Team member</DataTableHead>
                  <DataTableHead>Contact</DataTableHead>
                  <DataTableHead>Access level</DataTableHead>
                  <DataTableHead>Department</DataTableHead>
                  <DataTableHead>Role</DataTableHead>
                  <DataTableHead>Wage</DataTableHead>
                  <DataTableHead>Leave</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead align="right">Actions</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {filtered.length === 0 ? (
                  <DataTableRow>
                    <DataTableCell colSpan={9}>
                      <DataTableEmpty>
                        No team members match your filters.
                      </DataTableEmpty>
                    </DataTableCell>
                  </DataTableRow>
                ) : (
                  filtered.map((employee) => {
                    const terminated = employee.status === "terminated";
                    const onboarding = getRosterOnboardingStatus(employee);
                    const wage = formatWage(employee, currency);

                    return (
                      <DataTableRow
                        key={employee.id}
                        sx={terminated ? { opacity: 0.65 } : undefined}
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
                            <Box
                              component={Link}
                              href={`/employees/${employee.id}`}
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                textDecoration: terminated
                                  ? "line-through"
                                  : "none",
                                color: terminated
                                  ? "text.secondary"
                                  : "text.primary",
                                "&:hover": {
                                  color: terminated
                                    ? "text.secondary"
                                    : "primary.main",
                                  textDecoration: terminated
                                    ? "line-through"
                                    : "underline",
                                },
                              }}
                            >
                              {employee.full_name}
                            </Box>
                          </Stack>
                        </DataTableCell>

                        <DataTableCell>
                          <Stack spacing={0.25}>
                            {employee.email ? (
                              <Typography
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: "text.primary",
                                }}
                              >
                                {employee.email}
                              </Typography>
                            ) : (
                              <Box
                                component={Link}
                                href={profileHref(employee.id, "personal")}
                                sx={addContactLinkSx}
                              >
                                Add email
                              </Box>
                            )}
                            {employee.phone ? (
                              <Typography
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: "text.secondary",
                                }}
                              >
                                {employee.phone}
                              </Typography>
                            ) : (
                              <Box
                                component={Link}
                                href={profileHref(employee.id, "personal")}
                                sx={addContactLinkSx}
                              >
                                Add phone
                              </Box>
                            )}
                          </Stack>
                        </DataTableCell>

                        <DataTableCell>
                          <Typography
                            sx={{
                              fontSize: "0.8125rem",
                              color: "text.primary",
                            }}
                          >
                            {formatAccessLevel(employee.employment_type)}
                          </Typography>
                        </DataTableCell>

                        <DataTableCell>
                          <Typography
                            sx={{
                              fontSize: "0.8125rem",
                              color: "text.primary",
                              maxWidth: 140,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={employee.department ?? undefined}
                          >
                            {employee.department ?? "—"}
                          </Typography>
                        </DataTableCell>

                        <DataTableCell>
                          {employee.position ? (
                            <Typography
                              sx={{
                                fontSize: "0.8125rem",
                                color: "text.primary",
                              }}
                            >
                              {employee.position}
                            </Typography>
                          ) : (
                            <Box
                              component={Link}
                              href={profileHref(employee.id, "job-details")}
                              sx={addOptionalLinkSx}
                            >
                              Add role
                            </Box>
                          )}
                        </DataTableCell>

                        <DataTableCell>
                          {wage ? (
                            <Typography
                              sx={{
                                fontSize: "0.8125rem",
                                fontVariantNumeric: "tabular-nums",
                                color: "text.primary",
                              }}
                            >
                              {wage}
                            </Typography>
                          ) : (
                            <Box
                              component={Link}
                              href={profileHref(employee.id, "job-details")}
                              sx={addOptionalLinkSx}
                            >
                              Add wage
                            </Box>
                          )}
                        </DataTableCell>

                        <DataTableCell>
                          <Typography
                            sx={{
                              fontSize: "0.8125rem",
                              fontVariantNumeric: "tabular-nums",
                              color: "text.secondary",
                            }}
                            title="Leave remaining / allotted for current leave year"
                          >
                            {leaveRemainingByEmployeeId[employee.id] ?? "—"}
                          </Typography>
                        </DataTableCell>

                        <DataTableCell>
                          <StatusBadge
                            tone={rosterStatusTone(onboarding)}
                            theme="dark"
                          >
                            {rosterStatusLabel(onboarding)}
                          </StatusBadge>
                        </DataTableCell>

                        <DataTableCell
                          align="right"
                          sx={{ whiteSpace: "nowrap" }}
                        >
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
