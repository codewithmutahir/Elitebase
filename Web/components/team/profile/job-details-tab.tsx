"use client";

import { ChevronDown, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmployeeJobDetails } from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RosterPinCell } from "@/components/team/roster-pin-cell";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatDateShort,
  formatHourlyRate,
} from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";
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
  const [editing, setEditing] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [employmentType, setEmploymentType] = useState(employee.employment_type);
  const [hourlyRate, setHourlyRate] = useState(String(employee.hourly_rate));
  const [hireDate, setHireDate] = useState(employee.hire_date ?? "");

  function save() {
    startTransition(async () => {
      const result = await updateEmployeeJobDetails(employee.id, {
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onUpdated({
        employment_type: employmentType,
        hourly_rate: Number(hourlyRate) || 0,
        hire_date: hireDate || null,
      });
      setEditing(false);
      toast.success("Job details saved");
    });
  }

  const roleLabel =
    employee.position || employee.department || employee.employment_type;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Access, Roles & Wages
            </h3>
          </div>
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
            <span className="font-medium text-slate-900">{companyName}</span>
            {employee.status === "active" ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="error">Terminated</StatusBadge>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Access
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) =>
                      setEmploymentType(
                        e.target.value as EmployeeProfile["employment_type"]
                      )
                    }
                    className="flex h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Hourly rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-white pl-7 pr-3 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
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
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Access
                </dt>
                <dd className="mt-1 capitalize text-slate-900">
                  {employee.employment_type}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  PIN
                </dt>
                <dd className="mt-1">
                  <RosterPinCell
                    employeeId={employee.id}
                    hasPin={employee.hasPin}
                    pin={employee.pin}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Start Date
                </dt>
                <dd className="mt-1 text-slate-900">
                  {formatDateShort(employee.hire_date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  Role & Wages
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 text-slate-900">
                  <span>
                    {roleLabel} · {formatHourlyRate(employee.hourly_rate)}/hr
                  </span>
                  <StatusBadge tone="info">Primary role</StatusBadge>
                </dd>
              </div>
            </dl>
          )}

          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm text-slate-600">
            <p>
              Kiosk face:{" "}
              {employee.face_registered_at ? (
                <span className="font-medium text-emerald-700">Enrolled</span>
              ) : (
                <span className="font-medium text-amber-700">Pending at kiosk</span>
              )}
              {" · "}
              PIN {employee.hasPin ? "configured" : "not set"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between px-6 py-4 text-left"
          onClick={() => setLocationOpen((o) => !o)}
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Location Settings
          </h3>
          <ChevronDown
            className={cn(
              "size-5 text-slate-400 transition-transform",
              locationOpen && "rotate-180"
            )}
          />
        </button>
        {locationOpen ? (
          <CardContent className="space-y-2 border-t border-slate-100 pt-0 text-sm text-slate-700">
            {[
              "Show in Schedule",
              "Send Location Alerts",
              "Include in Time Clock",
              "Eligible for Open Shifts",
            ].map((label) => (
              <label key={label} className="flex items-center gap-2 py-1">
                <input type="checkbox" checked readOnly className="rounded" />
                {label}
              </label>
            ))}
            <label className="flex items-center gap-2 py-1 text-slate-500">
              <input type="checkbox" readOnly className="rounded" />
              Can waive missed breaks
            </label>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Job History
          </h3>
          <span className="text-sm text-slate-400">View all job history</span>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 border-l-2 border-slate-200 pl-4">
            {employee.hire_date ? (
              <>
                <li className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-blue-600" />
                  <p className="font-medium text-slate-900">
                    Hired at {companyName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateShort(employee.hire_date)}
                  </p>
                </li>
                <li className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-slate-300" />
                  <p className="font-medium text-slate-900">
                    Started as {roleLabel} ({formatHourlyRate(employee.hourly_rate)}
                    /hr)
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateShort(employee.hire_date)}
                  </p>
                </li>
              </>
            ) : (
              <li className="text-sm text-slate-500">No hire date on file.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900">
            Time Off Balances
          </h3>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-500">
          <p>No time off policies added yet.</p>
          <p className="mt-2 text-blue-600">View all time off →</p>
        </CardContent>
      </Card>
    </div>
  );
}
