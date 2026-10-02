"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import { updateEmployeePersonalInfo } from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateLong } from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileEditPanelSx,
  profileFieldLabelPlainSx,
  profileFieldLabelSx,
  profileValueSx,
} from "@/lib/dashboard/sx";

type PersonalTabProps = {
  employee: EmployeeProfile;
  onUpdated: (patch: Partial<EmployeeProfile>) => void;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        py: 1.5,
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
      }}
    >
      <Typography component="dt" sx={profileFieldLabelPlainSx}>
        {label}
      </Typography>
      <Typography component="dd" sx={profileValueSx}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

const cardHeaderRowSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

export function PersonalTab({ employee, onUpdated }: PersonalTabProps) {
  const [contactEditing, setContactEditing] = useState(false);
  const [additionalEditing, setAdditionalEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(employee.full_name);
  const [email, setEmail] = useState(employee.email ?? "");
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [emergencyName, setEmergencyName] = useState(
    employee.emergency_contact_name ?? "",
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    employee.emergency_contact_phone ?? "",
  );
  const [emergencyRelation, setEmergencyRelation] = useState(
    employee.emergency_contact_relation ?? "",
  );
  const [dob, setDob] = useState(employee.date_of_birth ?? "");
  const [employmentType, setEmploymentType] = useState(
    employee.employment_type,
  );

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
    <Stack spacing={3}>
      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Contact Information
          </Typography>
          {!contactEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setContactEditing(true)}
              aria-label="Edit contact information"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {contactEditing ? (
            <Box sx={profileEditPanelSx}>
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
                [
                  "Relationship",
                  emergencyRelation,
                  setEmergencyRelation,
                  "text",
                ],
              ].map(([label, val, setVal, type]) => (
                <Input
                  key={label as string}
                  label={label as string}
                  type={type as string}
                  value={val as string}
                  onChange={(e) =>
                    (setVal as (v: string) => void)(e.target.value)
                  }
                />
              ))}
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <Button
                  variant="outline"
                  onClick={() => setContactEditing(false)}
                >
                  Cancel
                </Button>
                <Button disabled={pending} onClick={saveContact}>
                  Save
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="dl" sx={{ m: 0 }}>
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
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader sx={cardHeaderRowSx}>
          <Typography component="h3" sx={dashboardSectionTitleSx}>
            Additional Information
          </Typography>
          {!additionalEditing && !contactEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setAdditionalEditing(true)}
              aria-label="Edit additional information"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {additionalEditing ? (
            <Box sx={profileEditPanelSx}>
              <Input
                label="Date of birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <Select
                label="Employment type"
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(
                    e.target.value as EmployeeProfile["employment_type"],
                  )
                }
                displayEmpty={false}
                options={[
                  { value: "employee", label: "Employee" },
                  { value: "manager", label: "Manager" },
                  { value: "contractor", label: "Contractor" },
                ]}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outline"
                  onClick={() => setAdditionalEditing(false)}
                >
                  Cancel
                </Button>
                <Button disabled={pending} onClick={saveContact}>
                  Save
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box component="dl" sx={{ m: 0 }}>
              <FieldRow
                label="Date of birth"
                value={formatDateLong(employee.date_of_birth)}
              />
              <FieldRow
                label="Employment type"
                value={employee.employment_type}
              />
            </Box>
          )}
          <Typography
            sx={{ ...dashboardPageIntroSx, mt: 2, fontSize: "0.75rem" }}
          >
            Sensitive information is only visible to admins.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
