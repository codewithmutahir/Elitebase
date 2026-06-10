"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateEmployeePersonalInfo } from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateLong } from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";

type PersonalTabProps = {
  employee: EmployeeProfile;
  onUpdated: (patch: Partial<EmployeeProfile>) => void;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-slate-50 py-3 sm:grid-cols-2">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export function PersonalTab({ employee, onUpdated }: PersonalTabProps) {
  const [contactEditing, setContactEditing] = useState(false);
  const [additionalEditing, setAdditionalEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(employee.full_name);
  const [email, setEmail] = useState(employee.email ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [emergencyName, setEmergencyName] = useState(
    employee.emergency_contact_name ?? ""
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    employee.emergency_contact_phone ?? ""
  );
  const [emergencyRelation, setEmergencyRelation] = useState(
    employee.emergency_contact_relation ?? ""
  );
  const [dob, setDob] = useState(employee.date_of_birth ?? "");
  const [employmentType, setEmploymentType] = useState(employee.employment_type);

  function saveContact() {
    startTransition(async () => {
      const result = await updateEmployeePersonalInfo(employee.id, {
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        emergency_contact_relation: emergencyRelation || null,
        date_of_birth: dob || null,
        employment_type: employmentType,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onUpdated({
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
        emergency_contact_relation: emergencyRelation || null,
        date_of_birth: dob || null,
        employment_type: employmentType,
      });
      setContactEditing(false);
      setAdditionalEditing(false);
      toast.success("Personal information saved");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h3 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h3>
          {!contactEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setContactEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {contactEditing ? (
            <div className="space-y-3">
              {[
                ["Preferred name", fullName, setFullName, "text"],
                ["Personal email", email, setEmail, "email"],
                ["Mobile number", phone, setPhone, "tel"],
                ["Emergency contact", emergencyName, setEmergencyName, "text"],
                [
                  "Emergency contact phone",
                  emergencyPhone,
                  setEmergencyPhone,
                  "tel",
                ],
                ["Relationship", emergencyRelation, setEmergencyRelation, "text"],
              ].map(([label, val, setVal, type]) => (
                <div key={label as string} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">
                    {label as string}
                  </label>
                  <input
                    type={type as string}
                    value={val as string}
                    onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setContactEditing(false)}>
                  Cancel
                </Button>
                <Button disabled={pending} onClick={saveContact}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <dl>
              <FieldRow label="Preferred name" value={employee.full_name} />
              <FieldRow label="Personal email" value={employee.email ?? ""} />
              <FieldRow label="Mobile number" value={employee.phone ?? ""} />
              <FieldRow
                label="Emergency contact"
                value={employee.emergency_contact_name ?? ""}
              />
              <FieldRow
                label="Emergency contact phone"
                value={employee.emergency_contact_phone ?? ""}
              />
              <FieldRow
                label="Relationship"
                value={employee.emergency_contact_relation ?? ""}
              />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h3 className="text-lg font-semibold text-slate-900">
            Additional Information
          </h3>
          {!additionalEditing && !contactEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setAdditionalEditing(true)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {additionalEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">
                  Employment type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(
                      e.target.value as EmployeeProfile["employment_type"]
                    )
                  }
                  className="flex h-10 w-full rounded-lg border border-input px-3 text-sm"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAdditionalEditing(false)}
                >
                  Cancel
                </Button>
                <Button disabled={pending} onClick={saveContact}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <dl>
              <FieldRow
                label="Date of birth"
                value={formatDateLong(employee.date_of_birth)}
              />
              <FieldRow
                label="Employment type"
                value={employee.employment_type}
              />
            </dl>
          )}
          <p className="mt-4 text-xs text-slate-500">
            Sensitive information is only visible to admins.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
