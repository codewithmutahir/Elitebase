"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  createPayslip,
  deletePayslip,
} from "@/app/(dashboard)/team/payslips/actions";
import {
  bulkGeneratePayslipDrafts,
  generatePayslipDraft,
  markPayslipApproved,
  markPayslipReviewed,
  publishPayslip,
  revisePublishedPayslip,
  setPayslipStamp,
} from "@/app/(dashboard)/team/payslips/lifecycle-actions";
import { PayslipDocument } from "@/components/payslips/payslip-document";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  dashboardAlertErrorSx,
  dashboardAlertSuccessSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
} from "@/lib/dashboard/sx";
import { dashboardDialogContentClass } from "@/lib/dashboard/styles";
import type { EmployeeListItem } from "@/lib/employees/queries";
import { getUserFacingError } from "@/lib/errors/user-facing";
import { formatMoney } from "@/lib/money/format";
import {
  formatPayslipPeriod,
  type PayslipRow,
} from "@/lib/payslips/queries";
import { formatPayslipStatus } from "@/lib/payslips/status";

type PayslipsViewProps = {
  payslips: PayslipRow[];
  employees: EmployeeListItem[];
  currency: string | null;
  companyName: string;
  logoUrl: string | null;
};

export function PayslipsView({
  payslips,
  employees,
  currency,
  companyName,
  logoUrl,
}: PayslipsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const now = new Date();
  const [genEmployeeId, setGenEmployeeId] = useState("");
  const [genYear, setGenYear] = useState(String(now.getFullYear()));
  const [genMonth, setGenMonth] = useState(String(now.getMonth() + 1));
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reviseTarget, setReviseTarget] = useState<PayslipRow | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "active"),
    [employees]
  );

  const preview = payslips.find((p) => p.id === previewId) ?? null;

  function submitRevision() {
    if (!reviseTarget) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await revisePublishedPayslip({
        payslipId: reviseTarget.id,
        revisionNote,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        `Revision v${"version" in result ? result.version : "?"} created as draft. Review → Approve → Publish when ready.`
      );
      if ("id" in result && result.id) setPreviewId(result.id);
      setReviseTarget(null);
      setRevisionNote("");
      router.refresh();
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
            Generate from attendance
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Creates a draft using salary, leave balance, lates, loans, and
            allowances. Review → Approve → Publish before employees can see it.
          </Typography>
        </CardHeader>
        <CardContent>
          <Stack spacing={2}>
            <Select
              id="genEmployeeId"
              label="Employee"
              value={genEmployeeId || activeEmployees[0]?.id || ""}
              onChange={(e) => setGenEmployeeId(e.target.value)}
              displayEmpty={false}
              options={activeEmployees.map((employee) => ({
                value: employee.id,
                label: employee.full_name,
              }))}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <Input
                id="genYear"
                label="Year"
                type="number"
                value={genYear}
                onChange={(e) => setGenYear(e.target.value)}
              />
              <Input
                id="genMonth"
                label="Month (1–12)"
                type="number"
                min={1}
                max={12}
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
              />
            </Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
              <PendingButton
                type="button"
                pending={pending}
                pendingLabel="Generating…"
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  startTransition(async () => {
                    const result = await generatePayslipDraft({
                      employeeId: genEmployeeId || activeEmployees[0]?.id || "",
                      year: Number(genYear),
                      month: Number(genMonth),
                    });
                    if ("error" in result && result.error) {
                      setError(result.error);
                      return;
                    }
                    setSuccess("Draft generated.");
                    if ("id" in result && result.id) setPreviewId(result.id);
                    router.refresh();
                  });
                }}
              >
                Generate draft
              </PendingButton>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  startTransition(async () => {
                    const result = await bulkGeneratePayslipDrafts({
                      year: Number(genYear),
                      month: Number(genMonth),
                    });
                    setSuccess(
                      `Bulk generate: ${result.successCount} ok, ${result.failureCount} failed.`
                    );
                    router.refresh();
                  });
                }}
              >
                Generate for all active
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {preview?.snapshot ? (
        <PayslipDocument
          data={preview.snapshot}
          meta={{
            companyName,
            logoUrl,
            currency: preview.currency ?? currency,
            reviewedByName: preview.reviewed_by_name,
            reviewedAt: preview.reviewed_at,
            approvedByName: preview.approved_by_name,
            approvedAt: preview.approved_at,
            applyCompanyStamp: preview.apply_company_stamp,
          }}
          mode="edit"
        />
      ) : null}

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Upload payslip (legacy)
          </Typography>
          <Typography sx={dashboardPageIntroSx}>
            Employees see published slips in their portal. Optional PDF/image
            upload (max 5 MB).
          </Typography>
        </CardHeader>
        <CardContent>
          {activeEmployees.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              Add an active employee first.
            </Typography>
          ) : (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                setError(null);
                setSuccess(null);
                startTransition(async () => {
                  try {
                    const result = await createPayslip(formData);
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setSuccess("Payslip published.");
                    event.currentTarget.reset();
                    router.refresh();
                  } catch (caught) {
                    setError(getUserFacingError(caught));
                  }
                });
              }}
            >
              <Stack spacing={2}>
                <Select
                  id="employeeId"
                  name="employeeId"
                  label="Employee"
                  defaultValue={activeEmployees[0]?.id}
                  displayEmpty={false}
                  options={activeEmployees.map((employee) => ({
                    value: employee.id,
                    label: employee.full_name,
                  }))}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="periodStart"
                    name="periodStart"
                    label="Period start"
                    type="date"
                    required
                  />
                  <Input
                    id="periodEnd"
                    name="periodEnd"
                    label="Period end"
                    type="date"
                    required
                  />
                </div>
                <Input
                  id="periodLabel"
                  name="periodLabel"
                  label="Label (optional)"
                  placeholder="March 2026"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id="grossAmount"
                    name="grossAmount"
                    label="Gross (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <Input
                    id="netAmount"
                    name="netAmount"
                    label="Net (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Input id="notes" name="notes" label="Notes (optional)" />
                <div>
                  <label
                    htmlFor="file"
                    className="mb-1.5 block text-sm font-medium text-[var(--eb-text)]"
                  >
                    File (optional)
                  </label>
                  <input
                    id="file"
                    name="file"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="block w-full text-sm text-[var(--eb-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--eb-accent)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                  />
                </div>
                <PendingButton
                  type="submit"
                  pending={pending}
                  pendingLabel="Publishing…"
                  className="w-fit"
                >
                  Publish payslip
                </PendingButton>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={dashboardCardSx}>
        <CardHeader>
          <Typography component="h2" sx={dashboardSectionTitleSx}>
            Payslips
          </Typography>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <Typography sx={dashboardPageIntroSx}>
              No payslips yet. Generate a draft or upload a file.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {payslips.map((row) => (
                <Box
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--eb-border)] px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--eb-text)]">
                      {row.employee_name} · {formatPayslipPeriod(row)} ·{" "}
                      {formatPayslipStatus(row.status)}
                      {row.version > 1 ? ` · v${row.version}` : ""}
                    </p>
                    <p className="text-xs text-[var(--eb-muted)]">
                      {row.net_amount != null
                        ? `Net ${formatMoney(row.net_amount, row.currency ?? currency)}`
                        : row.gross_amount != null
                          ? `Gross ${formatMoney(row.gross_amount, row.currency ?? currency)}`
                          : "No amounts"}
                      {row.file_url ? " · File attached" : ""}
                      {row.reviewed_by_name
                        ? ` · Reviewed by ${row.reviewed_by_name}`
                        : ""}
                      {row.approved_by_name
                        ? ` · Approved by ${row.approved_by_name}`
                        : ""}
                      {row.revision_note
                        ? ` · Revision: ${row.revision_note}`
                        : ""}
                      {row.supersedes_id ? " · Edits prior published version" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {row.snapshot ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewId((id) => (id === row.id ? null : row.id))
                        }
                      >
                        {previewId === row.id ? "Hide" : "Preview"}
                      </Button>
                    ) : null}
                    {row.status === "published" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setRevisionNote("");
                          setReviseTarget(row);
                        }}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {row.status === "draft" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await markPayslipReviewed(row.id);
                            if (result.error) setError(result.error);
                            else {
                              setSuccess("Marked reviewed.");
                              router.refresh();
                            }
                          });
                        }}
                      >
                        Mark reviewed
                      </Button>
                    ) : null}
                    {row.status === "reviewed" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await markPayslipApproved(row.id);
                            if (result.error) setError(result.error);
                            else {
                              setSuccess("Approved.");
                              router.refresh();
                            }
                          });
                        }}
                      >
                        Approve
                      </Button>
                    ) : null}
                    {row.status === "approved" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await publishPayslip(row.id);
                            if (result.error) setError(result.error);
                            else {
                              setSuccess("Published to employee portal.");
                              router.refresh();
                            }
                          });
                        }}
                      >
                        Publish
                      </Button>
                    ) : null}
                    {row.status !== "published" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending || (!logoUrl && !row.apply_company_stamp)}
                        title={
                          !logoUrl
                            ? "Upload a company logo in Settings first"
                            : undefined
                        }
                        onClick={() => {
                          startTransition(async () => {
                            const result = await setPayslipStamp(
                              row.id,
                              !row.apply_company_stamp
                            );
                            if (result.error) setError(result.error);
                            else router.refresh();
                          });
                        }}
                      >
                        {row.apply_company_stamp ? "Remove stamp" : "Stamp"}
                      </Button>
                    ) : null}
                    {row.file_url ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={row.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        File
                      </Button>
                    ) : null}
                    {row.status !== "published" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          setSuccess(null);
                          startTransition(async () => {
                            try {
                              const result = await deletePayslip(row.id);
                              if (result.error) {
                                setError(result.error);
                                return;
                              }
                              setSuccess("Payslip deleted.");
                              router.refresh();
                            } catch (caught) {
                              setError(getUserFacingError(caught));
                            }
                          });
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={reviseTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setReviseTarget(null);
            setRevisionNote("");
          }
        }}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Edit published payslip</DialogTitle>
            <DialogDescription>
              Creates a new draft revision (v
              {reviseTarget ? reviseTarget.version + 1 : "—"}) for{" "}
              {reviseTarget?.employee_name}. The published copy stays visible to
              the employee until you review, approve, and publish this revision.
              Edits are audit-logged with your note.
            </DialogDescription>
          </DialogHeader>
          <Input
            id="revision-note"
            label="Revision note (required)"
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="e.g. Corrected late deduction after attendance fix"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setReviseTarget(null);
                setRevisionNote("");
              }}
            >
              Cancel
            </Button>
            <PendingButton
              type="button"
              pending={pending}
              pendingLabel="Creating…"
              disabled={revisionNote.trim().length < 3}
              onClick={submitRevision}
            >
              Create revision draft
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
