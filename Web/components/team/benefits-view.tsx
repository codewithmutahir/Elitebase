"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  assignEmployeeBenefit,
  createCompanyBenefit,
  removeEmployeeBenefit,
  setCompanyBenefitActive,
} from "@/app/(dashboard)/team/benefits/actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import {
  formatBenefitCategory,
  formatEnrollmentStatus,
  type CompanyBenefitRow,
  type EmployeeBenefitRow,
} from "@/lib/benefits/queries";
import type { EmployeeListItem } from "@/lib/employees/queries";
import { getUserFacingError } from "@/lib/errors/user-facing";

type BenefitsViewProps = {
  benefits: CompanyBenefitRow[];
  assignments: EmployeeBenefitRow[];
  employees: EmployeeListItem[];
};

export function BenefitsView({
  benefits,
  assignments,
  employees,
}: BenefitsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const activeBenefits = benefits.filter((b) => b.is_active);

  function run(
    action: () => Promise<{ error?: string; ok?: true }>,
    okMessage: string
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess(okMessage);
        router.refresh();
      } catch (caught) {
        setError(getUserFacingError(caught));
      }
    });
  }

  return (
    <Stack spacing={3}>
      {success ? (
        <Typography sx={dashboardAlertSuccessSx}>{success}</Typography>
      ) : null}
      {error ? (
        <Typography sx={dashboardAlertErrorSx}>{error}</Typography>
      ) : null}

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Add benefit
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Define benefits employees can see in their portal after you assign
            them.
          </Typography>
        </CardHeader>
        <CardContent>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              run(() => createCompanyBenefit(formData), "Benefit created.");
              event.currentTarget.reset();
            }}
          >
            <Stack spacing={2}>
              <Input id="name" name="name" label="Name" required />
              <Select
                id="category"
                name="category"
                label="Category"
                defaultValue="health"
                displayEmpty={false}
                options={[
                  { value: "health", label: "Health" },
                  { value: "dental", label: "Dental" },
                  { value: "vision", label: "Vision" },
                  { value: "retirement", label: "Retirement" },
                  { value: "pto", label: "PTO" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Input
                id="description"
                name="description"
                label="Description (optional)"
              />
              <PendingButton
                type="submit"
                pending={pending}
                pendingLabel="Saving…"
                className="w-fit"
              >
                Add benefit
              </PendingButton>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Benefit catalog
          </Typography>
        </CardHeader>
        <CardContent>
          {benefits.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>No benefits yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {benefits.map((benefit) => (
                <Box
                  key={benefit.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--eb-border)] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--eb-text)]">
                      {benefit.name}
                    </p>
                    <p className="text-xs text-[var(--eb-muted)]">
                      {formatBenefitCategory(benefit.category)}
                      {benefit.is_active ? "" : " · Inactive"}
                      {benefit.description ? ` · ${benefit.description}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          setCompanyBenefitActive(benefit.id, !benefit.is_active),
                        benefit.is_active ? "Benefit deactivated." : "Benefit activated."
                      )
                    }
                  >
                    {benefit.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Assign to employee
          </Typography>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 || activeBenefits.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              Add an active employee and an active benefit first.
            </Typography>
          ) : (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                run(() => assignEmployeeBenefit(formData), "Benefit assigned.");
              }}
            >
              <Stack spacing={2}>
                <Select
                  id="employeeId"
                  name="employeeId"
                  label="Employee"
                  defaultValue={activeEmployees[0]?.id}
                  displayEmpty={false}
                  options={activeEmployees.map((e) => ({
                    value: e.id,
                    label: e.full_name,
                  }))}
                />
                <Select
                  id="benefitId"
                  name="benefitId"
                  label="Benefit"
                  defaultValue={activeBenefits[0]?.id}
                  displayEmpty={false}
                  options={activeBenefits.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                />
                <Select
                  id="status"
                  name="status"
                  label="Status"
                  defaultValue="enrolled"
                  displayEmpty={false}
                  options={[
                    { value: "enrolled", label: "Enrolled" },
                    { value: "eligible", label: "Eligible" },
                    { value: "waived", label: "Waived" },
                  ]}
                />
                <Input id="notes" name="notes" label="Notes (optional)" />
                <PendingButton
                  type="submit"
                  pending={pending}
                  pendingLabel="Assigning…"
                  className="w-fit"
                >
                  Assign benefit
                </PendingButton>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Assignments
          </Typography>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              No benefit assignments yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {assignments.map((row) => (
                <Box
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--eb-border)] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--eb-text)]">
                      {row.employee_name} · {row.benefit_name}
                    </p>
                    <p className="text-xs text-[var(--eb-muted)]">
                      {formatEnrollmentStatus(row.status)} ·{" "}
                      {formatBenefitCategory(row.category)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => removeEmployeeBenefit(row.id),
                        "Assignment removed."
                      )
                    }
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
