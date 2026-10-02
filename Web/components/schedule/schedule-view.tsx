"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { publishDraftShifts } from "@/app/(dashboard)/schedule/schedule/actions";
import { AddShiftSheet, type AddShiftContext } from "@/components/schedule/add-shift-sheet";
import { ShiftCard } from "@/components/schedule/shift-card";
import { ShiftEditPopover } from "@/components/schedule/shift-edit-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { DepartmentWithRoles } from "@/lib/departments/queries";
import {
  formatHours,
  formatWages,
} from "@/lib/schedules/format";
import {
  dayEarnings,
  earningsLabel,
  employeeWeekEarnings,
} from "@/lib/schedules/wages";
import {
  groupShifts,
  type ScheduleEmployeeRow,
  type ScheduleShift,
} from "@/lib/schedules/queries";
import {
  GRID_DAYS,
  addWeeks,
  dateForDayInWeek,
  formatWeekParam,
  formatWeekRangeLong,
  isSameCalendarDay,
  parseWeekParam,
  weekDateStrings,
} from "@/lib/availability/week";
import {
  formatOvertimeWarning,
  getScheduleOvertimeWarnings,
} from "@/lib/schedules/overtime";
import { isWorkingDayOnDate } from "@/lib/employees/working-days";
import { useCompany } from "@/contexts/company-context";
import { resolveCurrency } from "@/lib/currencies";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { dashboardDialogContentClass } from "@/lib/dashboard/styles";
import {
  dashboardCardSx,
  dashboardGridBodyCellSx,
  dashboardGridCornerHeadSx,
  dashboardGridDayHeadSx,
  dashboardGridOffDayCellSx,
  dashboardGridRowLabelCellSx,
  dashboardGridRowLabelCellMutedSx,
  dashboardGridTheadSx,
  dashboardGridTfootSx,
  dashboardPageIntroSx,
} from "@/lib/dashboard/sx";
import { cn } from "@/lib/utils";

type ScheduleViewProps = {
  employees: ScheduleEmployeeRow[];
  shifts: ScheduleShift[];
  departments: DepartmentWithRoles[];
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

function ScheduleCell({
  shifts,
  onAdd,
  onUpdated,
  isOffDay = false,
}: {
  shifts: ScheduleShift[];
  onAdd: () => void;
  onUpdated: () => void;
  isOffDay?: boolean;
}) {
  if (isOffDay) {
    return (
      <Box component="td" sx={dashboardGridOffDayCellSx}>
        <Box
          sx={{
            display: "flex",
            minHeight: 72,
            alignItems: "center",
            justifyContent: "center",
            p: 1,
          }}
        >
          <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--eb-muted)" }}>
            Off
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="td" sx={dashboardGridBodyCellSx}>
      <Box sx={{ position: "relative", minHeight: 72, p: 0.5, "&:hover .schedule-add-btn": { opacity: 1 } }}>
        <Box sx={{ position: "relative", zIndex: 10 }}>
          {shifts.map((shift) => (
            <ShiftEditPopover key={shift.id} shift={shift} onUpdated={onUpdated}>
              <ShiftCard shift={shift} />
            </ShiftEditPopover>
          ))}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onAdd}
          className="schedule-add-btn"
          aria-label="Add shift"
          sx={{
            position: "absolute",
            right: 4,
            top: 4,
            zIndex: 20,
            display: "flex",
            width: 28,
            height: 28,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            bgcolor: "var(--eb-accent)",
            color: "var(--eb-ink,#060A12)",
            opacity: 0,
            boxShadow: 2,
            transition: "opacity 0.15s ease",
          }}
        >
          <Plus className="size-3.5" aria-hidden />
        </Box>
      </Box>
    </Box>
  );
}

export function ScheduleView({
  employees,
  shifts,
  departments,
  weekStart,
}: ScheduleViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { company } = useCompany();
  const currency = resolveCurrency(company.currency);
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addContext, setAddContext] = useState<AddShiftContext | null>(null);
  const [overtimeOpen, setOvertimeOpen] = useState(false);

  const weekMonday = useMemo(() => parseWeekParam(weekStart), [weekStart]);
  const weekDates = useMemo(() => weekDateStrings(weekMonday), [weekMonday]);
  const weekLabel = formatWeekRangeLong(weekMonday);
  const today = useMemo(() => new Date(), []);

  const { openByDate, byEmployeeDate } = useMemo(
    () => groupShifts(shifts),
    [shifts]
  );

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const draftCount = useMemo(
    () => shifts.filter((s) => s.status === "draft").length,
    [shifts]
  );

  const overtimeWarnings = useMemo(() => {
    const names = new Map(
      employees.map((employee) => [employee.id, employee.full_name])
    );
    return getScheduleOvertimeWarnings(shifts, names, true);
  }, [employees, shifts]);

  function goToWeek(monday: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", formatWeekParam(monday));
    router.push(`/schedule/schedule?${params.toString()}`);
  }

  function openAddSheet(context: AddShiftContext) {
    setAddContext(context);
    setSheetOpen(true);
  }

  function refresh() {
    router.refresh();
  }

  function handlePublish() {
    if (overtimeWarnings.length > 0) {
      setOvertimeOpen(true);
      return;
    }
    confirmPublish();
  }

  function confirmPublish() {
    setOvertimeOpen(false);
    startTransition(async () => {
      const result = await publishDraftShifts(weekStart);
      if (!result.error) refresh();
    });
  }

  return (
    <Stack spacing={2}>
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
          sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToWeek(parseWeekParam(undefined))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToWeek(addWeeks(weekMonday, -1))}
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Typography
            component="span"
            sx={{
              minWidth: 240,
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
            onClick={() => goToWeek(addWeeks(weekMonday, 1))}
            aria-label="Next week"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <Select
            id="schedule-view-mode"
            value="week"
            disabled
            displayEmpty={false}
            fullWidth={false}
            options={[{ value: "week", label: "Week" }]}
            sx={{ ml: 1, width: "auto", minWidth: 96 }}
          />
        </Stack>

        <Button
          type="button"
          disabled={pending || draftCount === 0}
          onClick={handlePublish}
        >
          {pending
            ? "Publishing…"
            : draftCount > 0
              ? `Publish (${draftCount})`
              : "Publish"}
        </Button>
      </Stack>

      <Card sx={{ ...(dashboardCardSx as object), overflow: "hidden" }}>
        <Box sx={{ maxHeight: "calc(100vh - 220px)", overflow: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              minWidth: 960,
              borderCollapse: "collapse",
              fontSize: "0.875rem",
            }}
          >
            <Box component="thead" sx={dashboardGridTheadSx}>
              <Box component="tr">
                <Box component="th" sx={dashboardGridCornerHeadSx}>
                  &nbsp;
                </Box>
                {GRID_DAYS.map((day) => {
                  const date = dateForDayInWeek(weekMonday, day.dayOfWeek);
                  const isToday = isSameCalendarDay(date, today);
                  return (
                    <Box
                      component="th"
                      key={day.dayOfWeek}
                      sx={dashboardGridDayHeadSx}
                    >
                      <Typography
                        component="div"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          color: "var(--eb-muted)",
                        }}
                      >
                        {day.label}
                      </Typography>
                      <Box sx={{ mt: 0.5, display: "flex", justifyContent: "center" }}>
                        <Box
                          component="span"
                          sx={{
                            display: "flex",
                            width: 28,
                            height: 28,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            ...(isToday
                              ? {
                                  bgcolor: "var(--eb-accent)",
                                  color: "var(--eb-ink,#060A12)",
                                }
                              : { color: "var(--eb-text)" }),
                          }}
                        >
                          {date.getDate()}
                        </Box>
                      </Box>
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
              <motion.tr
                variants={fadeIn}
                style={{ borderBottom: "1px solid var(--eb-border)" }}
              >
                <Box component="td" sx={dashboardGridRowLabelCellMutedSx}>
                  <Typography sx={{ fontWeight: 600, color: "var(--eb-text)" }}>
                    Open shifts
                  </Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--eb-muted)" }}>
                    Unassigned
                  </Typography>
                </Box>
                {weekDates.map((dateStr) => (
                  <ScheduleCell
                    key={`open-${dateStr}`}
                    shifts={openByDate[dateStr] ?? []}
                    onAdd={() =>
                      openAddSheet({
                        employeeId: null,
                        isOpenShift: true,
                        shiftDate: dateStr,
                      })
                    }
                    onUpdated={refresh}
                  />
                ))}
              </motion.tr>

              {employees.map((employee) => {
                const totals = employeeWeekEarnings(
                  employee,
                  shifts,
                  employee.id,
                  weekMonday
                );
                const payLabel = earningsLabel(employee.pay_type);
                return (
                  <motion.tr
                    key={employee.id}
                    variants={fadeIn}
                    style={{ borderBottom: "1px solid var(--eb-border)" }}
                  >
                    <Box component="td" sx={dashboardGridRowLabelCellSx}>
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
                          <Typography sx={{ fontSize: "0.75rem", color: "var(--eb-muted)" }}>
                            {formatHours(totals.hours)} hrs / {payLabel}:{" "}
                            {formatWages(totals.wages, currency)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    {weekDates.map((dateStr) => {
                      const isOffDay = !isWorkingDayOnDate(
                        employee.working_days,
                        dateStr
                      );
                      return (
                        <ScheduleCell
                          key={`${employee.id}-${dateStr}`}
                          shifts={byEmployeeDate[employee.id]?.[dateStr] ?? []}
                          isOffDay={isOffDay}
                          onAdd={() =>
                            openAddSheet({
                              employeeId: employee.id,
                              isOpenShift: false,
                              shiftDate: dateStr,
                              employeeName: employee.full_name,
                            })
                          }
                          onUpdated={refresh}
                        />
                      );
                    })}
                  </motion.tr>
                );
              })}
            </motion.tbody>

            <Box component="tfoot" sx={dashboardGridTfootSx}>
              <Box component="tr">
                <Box
                  component="td"
                  sx={{
                    ...(dashboardGridCornerHeadSx as object),
                    py: 1,
                    textTransform: "none",
                  }}
                >
                  Totals
                </Box>
                {weekDates.map((dateStr) => {
                  const totals = dayEarnings(
                    employeesById,
                    shifts,
                    dateStr,
                    weekMonday
                  );
                  return (
                    <Box
                      component="td"
                      key={`total-${dateStr}`}
                      sx={{
                        borderLeft: "1px solid var(--eb-border)",
                        px: 1,
                        py: 1,
                        textAlign: "center",
                        fontSize: "0.75rem",
                        color: "var(--eb-muted)",
                      }}
                    >
                      <Box sx={{ lineHeight: 1.375 }}>
                        Wages: {formatWages(totals.wages, currency)}
                      </Box>
                      <Box sx={{ lineHeight: 1.375 }}>
                        Hours: {formatHours(totals.hours)}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>

      <AddShiftSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setAddContext(null);
        }}
        context={addContext}
        employees={employees}
        departments={departments}
        onSaved={refresh}
      />

      <Dialog open={overtimeOpen} onOpenChange={setOvertimeOpen}>
        <DialogContent
          className={cn("sm:max-w-md", dashboardDialogContentClass)}
        >
          <DialogHeader>
            <DialogTitle>Overtime warnings</DialogTitle>
            <DialogDescription>
              These draft shifts exceed 8 hours/day or 40 hours/week. You can
              still publish if this is intentional.
            </DialogDescription>
          </DialogHeader>
          <Box
            component="ul"
            sx={{
              ...dashboardPageIntroSx,
              maxHeight: 192,
              overflowY: "auto",
              m: 0,
              pl: 2.5,
              "& > li + li": { mt: 1 },
            }}
          >
            {overtimeWarnings.map((warning) => (
              <Box component="li" key={`${warning.kind}-${warning.employeeId}-${warning.date ?? "week"}`}>
                {formatOvertimeWarning(warning)}
              </Box>
            ))}
          </Box>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOvertimeOpen(false)}
            >
              Review schedule
            </Button>
            <Button type="button" disabled={pending} onClick={confirmPublish}>
              {pending ? "Publishing…" : "Publish anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
