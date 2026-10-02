"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  upsertEmployeeAvailability,
  type AvailabilityUpdateMode,
} from "@/app/(dashboard)/schedule/availability/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { downloadAvailabilityCsv } from "@/lib/availability/export";
import {
  cellDisplayLabel,
  getCellDisplayState,
  toInputTime,
} from "@/lib/availability/format";
import type {
  AvailabilityByEmployee,
  AvailabilitySlot,
  EmployeeAvailabilityRow,
} from "@/lib/availability/queries";
import {
  GRID_DAYS,
  addWeeks,
  dateForDayInWeek,
  formatWeekParam,
  formatWeekRangeLabel,
  parseWeekParam,
  shortDateLabel,
} from "@/lib/availability/week";
import type { DepartmentOption } from "@/lib/departments/queries";
import { fadeIn, staggerContainer } from "@/lib/animations";
import {
  dashboardGhostItemButtonClass,
  dashboardOutlineButtonClass,
  dashboardPopoverContentClass,
  dashboardPrimaryButtonClass,
} from "@/lib/dashboard/styles";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardStickyTableCellSx,
} from "@/lib/dashboard/sx";
import { cn } from "@/lib/utils";

const availabilityTableHeadRowSx = {
  borderBottom: "1px solid var(--eb-border)",
  backgroundColor: "color-mix(in srgb, var(--eb-elevated) 90%, transparent)",
} as const;

type AvailabilityViewProps = {
  employees: EmployeeAvailabilityRow[];
  availability: AvailabilityByEmployee;
  departmentOptions: DepartmentOption[];
  weekStart: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type CellEditorProps = {
  employeeId: string;
  employeeName: string;
  dayOfWeek: number;
  dayLabel: string;
  slot: AvailabilitySlot | undefined;
  onSaved: () => void;
};

function AvailabilityCellEditor({
  employeeId,
  employeeName,
  dayOfWeek,
  dayLabel,
  slot,
  onSaved,
}: CellEditorProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"menu" | "hours">("menu");
  const [startTime, setStartTime] = useState(
    toInputTime(slot?.start_time ?? null)
  );
  const [endTime, setEndTime] = useState(toInputTime(slot?.end_time ?? null));

  function save(mode: AvailabilityUpdateMode, hours?: { startTime: string; endTime: string }) {
    setError(null);
    startTransition(async () => {
      const result = await upsertEmployeeAvailability(
        employeeId,
        dayOfWeek,
        mode,
        hours
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <div className="space-y-2">
      <PopoverHeader>
        <PopoverTitle className="text-sm">
          {employeeName} · {dayLabel}
        </PopoverTitle>
      </PopoverHeader>

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      {view === "menu" ? (
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="ghost"
            className={dashboardGhostItemButtonClass}
            disabled={pending}
            onClick={() => save("all_day")}
          >
            Available all day
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={dashboardGhostItemButtonClass}
            disabled={pending}
            onClick={() => {
              setStartTime(toInputTime(slot?.start_time ?? "09:00:00"));
              setEndTime(toInputTime(slot?.end_time ?? "17:00:00"));
              setView("hours");
            }}
          >
            Set hours
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="justify-start font-normal text-red-600 hover:text-red-700"
            disabled={pending}
            onClick={() => save("unavailable")}
          >
            Unavailable
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              id={`start-${employeeId}-${dayOfWeek}`}
              label="Start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              id={`end-${employeeId}-${dayOfWeek}`}
              label="End"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("flex-1", dashboardOutlineButtonClass)}
              disabled={pending}
              onClick={() => setView("menu")}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              className={cn("flex-1", dashboardPrimaryButtonClass)}
              disabled={pending}
              onClick={() => save("hours", { startTime, endTime })}
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailabilityCell({
  employee,
  dayOfWeek,
  dayLabel,
  slot,
  onSaved,
}: {
  employee: EmployeeAvailabilityRow;
  dayOfWeek: number;
  dayLabel: string;
  slot: AvailabilitySlot | undefined;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const state = getCellDisplayState(slot);
  const label = cellDisplayLabel(slot);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex min-h-[52px] w-full flex-col items-center justify-center border-l border-[var(--eb-border)] px-2 py-2 text-center text-xs transition-colors hover:bg-[var(--eb-elevated)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eb-accent)] focus-visible:ring-inset",
              state === "unavailable" &&
                "bg-red-500/10 hover:bg-red-500/15",
              state === "partial" &&
                "bg-[var(--eb-accent)]/5 hover:bg-[var(--eb-accent)]/10",
              state === "available" && "bg-transparent"
            )}
            aria-label={`Edit ${employee.full_name} ${dayLabel} availability`}
          >
            {state === "unavailable" ? (
              <span className="font-medium text-red-600">Unavailable</span>
            ) : state === "partial" ? (
              <span className="font-semibold text-[var(--eb-accent)]">{label}</span>
            ) : null}
          </button>
        }
      />
      <PopoverContent
        align="center"
        className={cn("w-64 p-3", dashboardPopoverContentClass)}
      >
        <AvailabilityCellEditor
          employeeId={employee.id}
          employeeName={employee.full_name}
          dayOfWeek={dayOfWeek}
          dayLabel={dayLabel}
          slot={slot}
          onSaved={() => {
            setOpen(false);
            onSaved();
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function AvailabilityView({
  employees,
  availability,
  departmentOptions,
  weekStart,
}: AvailabilityViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [departmentId, setDepartmentId] = useState("all");

  const weekMonday = useMemo(() => parseWeekParam(weekStart), [weekStart]);
  const weekLabel = formatWeekRangeLabel(weekMonday);

  const filteredEmployees = useMemo(() => {
    if (departmentId === "all") return employees;
    return employees.filter((e) => e.department_id === departmentId);
  }, [employees, departmentId]);

  function navigateWeek(delta: number) {
    const nextMonday = addWeeks(weekMonday, delta);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", formatWeekParam(nextMonday));
    router.push(`/schedule/availability?${params.toString()}`);
  }

  function handleExport() {
    const subset =
      departmentId === "all"
        ? employees
        : employees.filter((e) => e.department_id === departmentId);
    downloadAvailabilityCsv(
      subset,
      availability,
      `team-availability-${weekStart}.csv`
    );
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          useFlexGap
          sx={{ alignItems: "center", gap: 1 }}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(-1)}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Typography
            component="span"
            sx={{
              minWidth: 200,
              textAlign: "center",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--eb-text)",
            }}
          >
            {weekLabel}
          </Typography>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigateWeek(1)}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </Stack>

        <Stack
          direction="row"
          useFlexGap
          sx={{ flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}
        >
          <Box sx={{ width: { xs: "100%", sm: 192 } }}>
            <Select
              id="availabilityDepartment"
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
          <Button type="button" variant="outline" onClick={handleExport}>
            <Download className="size-4" aria-hidden />
            Export availability
          </Button>
        </Stack>
      </Stack>

      <Typography sx={dashboardPageIntroSx}>
        Set recurring weekly availability. Click a cell to mark unavailable or
        set specific hours.
      </Typography>

      <Card sx={{ ...(dashboardCardSx as object), overflow: "hidden" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 900,
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <Box component="thead">
              <Box component="tr" sx={availabilityTableHeadRowSx}>
                <Box
                  component="th"
                  sx={{
                    ...(dashboardStickyTableCellSx as object),
                    width: 200,
                    minWidth: 200,
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--eb-muted)",
                  }}
                >
                  Employee
                </Box>
                {GRID_DAYS.map((day) => {
                  const date = dateForDayInWeek(weekMonday, day.dayOfWeek);
                  return (
                    <Box
                      component="th"
                      key={day.dayOfWeek}
                      sx={{
                        minWidth: 100,
                        borderLeft: "1px solid var(--eb-border)",
                        px: 1,
                        py: 1.5,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        component="div"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--eb-text)",
                        }}
                      >
                        {day.label}
                      </Typography>
                      <Typography
                        component="div"
                        sx={{
                          mt: 0.25,
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          color: "var(--eb-muted)",
                        }}
                      >
                        {shortDateLabel(date)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <motion.tbody
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {filteredEmployees.length === 0 ? (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={8}
                    sx={{
                      px: 3,
                      py: 8,
                      textAlign: "center",
                      color: "var(--eb-muted)",
                    }}
                  >
                    No employees match this filter.
                  </Box>
                </Box>
              ) : (
                filteredEmployees.map((employee) => (
                  <motion.tr
                    key={employee.id}
                    variants={fadeIn}
                    style={{
                      borderBottom: "1px solid var(--eb-border)",
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        ...(dashboardStickyTableCellSx as object),
                        width: 200,
                        minWidth: 200,
                      }}
                    >
                      <Stack
                        direction="row"
                        useFlexGap
                        sx={{ alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-[var(--eb-accent)]/15 text-xs font-bold text-[var(--eb-accent)]">
                            {initials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{ fontWeight: 600, color: "var(--eb-text)" }}
                          >
                            {employee.full_name}
                          </Typography>
                          {employee.department ? (
                            <Typography
                              noWrap
                              sx={{ fontSize: "0.75rem", color: "var(--eb-muted)" }}
                            >
                              {employee.department}
                            </Typography>
                          ) : null}
                        </Box>
                      </Stack>
                    </Box>
                    {GRID_DAYS.map((day) => (
                      <Box
                        component="td"
                        key={day.dayOfWeek}
                        sx={{ p: 0, verticalAlign: "stretch" }}
                      >
                        <AvailabilityCell
                          employee={employee}
                          dayOfWeek={day.dayOfWeek}
                          dayLabel={day.label}
                          slot={availability[employee.id]?.[day.dayOfWeek]}
                          onSaved={() => router.refresh()}
                        />
                      </Box>
                    ))}
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </Box>
        </Box>
      </Card>
    </Stack>
  );
}
