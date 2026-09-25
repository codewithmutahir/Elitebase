"use client";

import { ChevronDown, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmployeeJobDetails } from "@/app/(dashboard)/employees/profile-actions";
import { CurrencyAmountInput } from "@/components/ui/currency-amount-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCompany } from "@/contexts/company-context";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { resolveCurrency } from "@/lib/currencies";
import {
  dashboardNativeSelectClass,
  profileCardClass,
  profileEditPanelClass,
  profileFieldLabelClass,
  profileInputClass,
  profileKioskBannerClass,
  profileLinkClass,
  profileMutedClass,
  profileSectionTitleClass,
  profileTimelineBorderClass,
  profileTimelineDotClass,
  profileTimelineDotMutedClass,
  profileValueClass,
} from "@/lib/dashboard/styles";
import {
  formatDateShort,
  formatHourlyRate,
  formatMonthlySalary,
} from "@/lib/employees/format";
import type { EmployeeProfile, PayType } from "@/lib/employees/profile-queries";
import {
  ALL_ISO_DAYS,
  ISO_DAY_LABELS,
  WORKING_DAY_PRESETS,
  formatWorkingDaysLabel,
  normalizeWorkingDays,
  type WorkingDayPreset,
} from "@/lib/employees/working-days";
import { cn } from "@/lib/utils";

type JobDetailsTabProps = {
  employee: EmployeeProfile;
  companyName: string;
  onUpdated: (patch: Partial<EmployeeProfile>) => void;
};

export function JobDetailsTab({
  employee,
  companyName,
  onUpdated,
}: JobDetailsTabProps) {
  const { company } = useCompany();
  const { theme: dashboardTheme } = useDashboardTheme();
  const currency = resolveCurrency(company.currency);
  const [editing, setEditing] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [employmentType, setEmploymentType] = useState(employee.employment_type);
  const [payType, setPayType] = useState<PayType>(employee.pay_type);
  const [hourlyRate, setHourlyRate] = useState(String(employee.hourly_rate));
  const [salaryAmount, setSalaryAmount] = useState(
    employee.salary_amount != null ? String(employee.salary_amount) : ""
  );
  const [workingDays, setWorkingDays] = useState<number[]>(employee.working_days);
  const [hireDate, setHireDate] = useState(employee.hire_date ?? "");

  function applyPreset(preset: WorkingDayPreset) {
    setWorkingDays([...WORKING_DAY_PRESETS[preset]]);
  }

  function toggleWorkingDay(isoDay: number) {
    setWorkingDays((current) => {
      const normalized = normalizeWorkingDays(current);
      if (normalized.includes(isoDay)) {
        const next = normalized.filter((day) => day !== isoDay);
        return next.length > 0 ? next : normalized;
      }
      return normalizeWorkingDays([...normalized, isoDay]);
    });
  }

  function resetEditState() {
    setEmploymentType(employee.employment_type);
    setPayType(employee.pay_type);
    setHourlyRate(String(employee.hourly_rate));
    setSalaryAmount(
      employee.salary_amount != null ? String(employee.salary_amount) : ""
    );
    setWorkingDays(employee.working_days);
    setHireDate(employee.hire_date ?? "");
  }

  function save() {
    startTransition(async () => {
      const result = await updateEmployeeJobDetails(employee.id, {
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
        pay_type: payType,
        salary_amount:
          payType === "salary" ? Number(salaryAmount) || 0 : null,
        working_days: workingDays,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onUpdated({
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
        pay_type: payType,
        salary_amount:
          payType === "salary" ? Number(salaryAmount) || 0 : null,
        working_days: normalizeWorkingDays(workingDays),
      });
      setEditing(false);
      toast.success("Job details saved");
    });
  }

  const roleLabel =
    employee.position || employee.department || employee.employment_type;

  const compensationLabel =
    employee.pay_type === "salary" && employee.salary_amount
      ? formatMonthlySalary(employee.salary_amount, currency)
      : formatHourlyRate(employee.hourly_rate, currency);

  const badgeTheme = dashboardTheme;

  return (
    <div className="space-y-6">
      <Card className={profileCardClass}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <h3 className={profileSectionTitleClass}>Access, Roles & Wages</h3>
          {!editing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing(true)}
              aria-label="Edit job details"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", profileValueClass)}>{companyName}</span>
            {employee.status === "active" ? (
              <StatusBadge tone="success" theme={badgeTheme}>
                Active
              </StatusBadge>
            ) : (
              <StatusBadge tone="error" theme={badgeTheme}>
                Deactivated
              </StatusBadge>
            )}
          </div>

          {editing ? (
            <div className={profileEditPanelClass}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className={profileFieldLabelClass}>Access</label>
                  <select
                    value={employmentType}
                    onChange={(e) =>
                      setEmploymentType(
                        e.target.value as EmployeeProfile["employment_type"]
                      )
                    }
                    className={cn(dashboardNativeSelectClass, "mt-0")}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={profileFieldLabelClass}>Pay type</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as PayType)}
                    className={cn(dashboardNativeSelectClass, "mt-0")}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="salary">Fixed salary (monthly)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={profileFieldLabelClass}>Start date</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className={profileInputClass}
                  />
                </div>
                {payType === "hourly" ? (
                  <CurrencyAmountInput
                    id="hourly-rate"
                    label="Hourly rate"
                    value={hourlyRate}
                    onChange={setHourlyRate}
                    currency={currency}
                    variant="dashboard"
                  />
                ) : (
                  <CurrencyAmountInput
                    id="monthly-salary"
                    label="Monthly salary"
                    value={salaryAmount}
                    onChange={setSalaryAmount}
                    currency={currency}
                    variant="dashboard"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className={profileFieldLabelClass}>Working days</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(WORKING_DAY_PRESETS) as WorkingDayPreset[]).map(
                      (preset) => (
                        <Button
                          key={preset}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applyPreset(preset)}
                        >
                          {preset.replace("-", " ")}
                        </Button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {ALL_ISO_DAYS.map((isoDay) => (
                    <label
                      key={isoDay}
                      className={cn(
                        "inline-flex items-center gap-2 text-sm",
                        profileValueClass
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={normalizeWorkingDays(workingDays).includes(isoDay)}
                        onChange={() => toggleWorkingDay(isoDay)}
                        className="rounded"
                      />
                      {ISO_DAY_LABELS[isoDay]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetEditState();
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" disabled={pending} onClick={save}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className={profileFieldLabelClass}>Access</dt>
                <dd className={cn("mt-1 capitalize", profileValueClass)}>
                  {employee.employment_type}
                </dd>
              </div>
              <div>
                <dt className={profileFieldLabelClass}>PIN</dt>
                <dd className="mt-1">
                  <RosterPinCell
                    employeeId={employee.id}
                    hasPin={employee.hasPin}
                    pin={employee.pin}
                  />
                </dd>
              </div>
              <div>
                <dt className={profileFieldLabelClass}>Start Date</dt>
                <dd className={cn("mt-1", profileValueClass)}>
                  {formatDateShort(employee.hire_date)}
                </dd>
              </div>
              <div>
                <dt className={profileFieldLabelClass}>Role & Wages</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={profileValueClass}>
                    {roleLabel} · {compensationLabel}
                  </span>
                  <StatusBadge tone="neutral" theme={badgeTheme}>
                    Primary role
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt className={profileFieldLabelClass}>Working days</dt>
                <dd className={cn("mt-1", profileValueClass)}>
                  {formatWorkingDaysLabel(employee.working_days)}
                </dd>
              </div>
            </dl>
          )}

          <div className={profileKioskBannerClass}>
            <p>
              Kiosk face:{" "}
              {employee.needs_reenrollment ? (
                <span className="font-medium text-amber-400">Re-scan required at kiosk</span>
              ) : employee.face_registered_at ? (
                <span className="font-medium text-emerald-400">Enrolled</span>
              ) : (
                <span className="font-medium text-amber-400">Pending at kiosk</span>
              )}
              {" · "}
              PIN {employee.hasPin ? "configured" : "not set"}
            </p>
            {employee.needs_reenrollment ? (
              <p className="mt-2 text-xs text-amber-400/90">
                Their face was enrolled under the previous recognition model. Next
                clock-in they will be guided to re-scan once.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className={profileCardClass}>
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          onClick={() => setLocationOpen((o) => !o)}
        >
          <h3 className={profileSectionTitleClass}>Location Settings</h3>
          <ChevronDown
            className={cn(
              "size-5 text-[var(--eb-muted)] transition-transform",
              locationOpen && "rotate-180"
            )}
          />
        </button>
        {locationOpen ? (
          <CardContent className="space-y-2 border-t border-[var(--eb-border)] pt-4 text-sm">
            {[
              "Show in Schedule",
              "Send Location Alerts",
              "Include in Time Clock",
              "Eligible for Open Shifts",
            ].map((label) => (
              <label
                key={label}
                className={cn("flex items-center gap-2 py-1", profileValueClass)}
              >
                <input type="checkbox" checked readOnly className="rounded" />
                {label}
              </label>
            ))}
            <label
              className={cn("flex items-center gap-2 py-1", profileMutedClass)}
            >
              <input type="checkbox" readOnly className="rounded" />
              Can waive missed breaks
            </label>
          </CardContent>
        ) : null}
      </Card>

      <Card className={profileCardClass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className={profileSectionTitleClass}>Recent Job History</h3>
          <button type="button" className={cn("text-sm", profileLinkClass)}>
            View all job history
          </button>
        </CardHeader>
        <CardContent>
          <ul className={cn("space-y-4", profileTimelineBorderClass)}>
            {employee.hire_date ? (
              <>
                <li className="relative">
                  <span className={profileTimelineDotClass} />
                  <p className={cn("font-medium", profileValueClass)}>
                    Hired at {companyName}
                  </p>
                  <p className={cn("text-sm", profileMutedClass)}>
                    {formatDateShort(employee.hire_date)}
                  </p>
                </li>
                <li className="relative">
                  <span className={profileTimelineDotMutedClass} />
                  <p className={cn("font-medium", profileValueClass)}>
                    Started as {roleLabel} ({compensationLabel})
                  </p>
                  <p className={cn("text-sm", profileMutedClass)}>
                    {formatDateShort(employee.hire_date)}
                  </p>
                </li>
              </>
            ) : (
              <li className={cn("text-sm", profileMutedClass)}>No hire date on file.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className={profileCardClass}>
        <CardHeader>
          <h3 className={profileSectionTitleClass}>Time Off Balances</h3>
        </CardHeader>
        <CardContent className="text-center text-sm">
          <p className={profileMutedClass}>No time off policies added yet.</p>
          <p className="mt-2">
            <button type="button" className={profileLinkClass}>
              View all time off →
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
