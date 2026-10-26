"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Plus, Undo2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  recordSalaryIncrement,
  undoLatestSalaryIncrement,
} from "@/app/(dashboard)/employees/profile-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CurrencyAmountInput } from "@/components/ui/currency-amount-input";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useCompany } from "@/contexts/company-context";
import { resolveCurrency } from "@/lib/currencies";
import {
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileFieldLabelSx,
  profileTimelineContentSx,
  profileTimelineDotMutedSx,
  profileTimelineDotSx,
  profileTimelineListSx,
  profileTimelineMarkerColSx,
  profileTimelineRailSx,
  profileTimelineRowSx,
  profileValueSx,
} from "@/lib/dashboard/sx";
import { dashboardDialogContentClass } from "@/lib/dashboard/styles";
import { formatDateShort } from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";
import {
  SALARY_INCREMENT_KINDS,
  currentPayAmount,
  formatIncrementKind,
  type SalaryIncrement,
  type SalaryIncrementKind,
} from "@/lib/employees/salary-increments";
import {
  formatHourlyRate,
  formatMoney,
  formatMonthlySalary,
} from "@/lib/money/format";

type SalaryIncrementsCardProps = {
  employee: EmployeeProfile;
  onUpdated: (patch: Partial<EmployeeProfile>) => void;
};

function formatPayAmount(
  amount: number,
  payType: EmployeeProfile["pay_type"],
  currency: string
) {
  return payType === "salary"
    ? formatMonthlySalary(amount, currency)
    : formatHourlyRate(amount, currency);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function SalaryIncrementsCard({
  employee,
  onUpdated,
}: SalaryIncrementsCardProps) {
  const { company } = useCompany();
  const currency = resolveCurrency(company.currency);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [undoPending, startUndo] = useTransition();

  const increments = employee.salary_increments ?? [];
  const latest = increments[0] ?? null;
  const currentAmount = currentPayAmount(employee);

  const [effectiveDate, setEffectiveDate] = useState(todayIsoDate);
  const [newAmount, setNewAmount] = useState("");
  const [kind, setKind] = useState<SalaryIncrementKind>("raise");
  const [reason, setReason] = useState("");

  const previewDelta = useMemo(() => {
    const next = Number(newAmount);
    if (!Number.isFinite(next) || next <= 0) return null;
    return Math.round((next - currentAmount) * 100) / 100;
  }, [newAmount, currentAmount]);

  function openDialog() {
    setEffectiveDate(todayIsoDate());
    setNewAmount(currentAmount > 0 ? String(currentAmount) : "");
    setKind("raise");
    setReason("");
    setDialogOpen(true);
  }

  function saveIncrement() {
    startTransition(async () => {
      const result = await recordSalaryIncrement(employee.id, {
        effective_date: effectiveDate,
        new_amount: Number(newAmount),
        kind,
        reason: reason.trim() || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (!result.ok || !result.increment) {
        toast.error("Could not save increment.");
        return;
      }

      const nextHistory = [result.increment, ...increments];
      onUpdated({
        salary_increments: nextHistory,
        pay_type: result.pay_type,
        salary_amount: result.salary_amount,
        hourly_rate: result.hourly_rate,
      });
      setDialogOpen(false);
      toast.success("Increment recorded");
    });
  }

  function undoLatest() {
    if (!latest) return;
    startUndo(async () => {
      const result = await undoLatestSalaryIncrement(employee.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (!("ok" in result) || !result.ok) return;
      const restored = result.restored_amount;
      const remaining = increments.slice(1);
      const patch: Partial<EmployeeProfile> = {
        salary_increments: remaining,
      };
      if (employee.pay_type === "salary") {
        patch.salary_amount = restored > 0 ? restored : null;
      } else {
        patch.hourly_rate = restored;
      }
      onUpdated(patch);
      toast.success("Latest increment undone");
    });
  }

  return (
    <>
      <Card sx={dashboardCardSx}>
        <CardHeader
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography component="h3" sx={dashboardSectionTitleSx}>
              Salary increments
            </Typography>
            <Typography sx={{ ...dashboardPageIntroSx, mt: 0.5 }}>
              Full raise history — not just the last change.
            </Typography>
          </Box>
          <Button type="button" size="sm" onClick={openDialog}>
            <Plus className="size-4" aria-hidden />
            Record increment
          </Button>
        </CardHeader>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography component="dt" sx={profileFieldLabelSx}>
                Current pay
              </Typography>
              <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                {formatPayAmount(currentAmount, employee.pay_type, currency)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography component="dt" sx={profileFieldLabelSx}>
                Last increment date
              </Typography>
              <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                {latest ? formatDateShort(latest.effective_date) : "—"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography component="dt" sx={profileFieldLabelSx}>
                Last increment amount
              </Typography>
              <Typography component="dd" sx={{ ...profileValueSx, mt: 0.5 }}>
                {latest
                  ? `${latest.increment_amount >= 0 ? "+" : ""}${formatMoney(latest.increment_amount, currency)}`
                  : "—"}
              </Typography>
            </Grid>
          </Grid>

          {increments.length === 0 ? (
            <Typography sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}>
              No increments recorded yet. Use Record increment when pay changes
              so history stays accurate.
            </Typography>
          ) : (
            <Box sx={{ position: "relative" }}>
              <Box component="span" sx={profileTimelineRailSx} aria-hidden />
              <Stack component="ul" spacing={2} sx={profileTimelineListSx}>
                {increments.map((row, index) => (
                  <IncrementTimelineRow
                    key={row.id}
                    row={row}
                    currency={currency}
                    isLatest={index === 0}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {latest ? (
            <Box>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={undoPending}
                onClick={undoLatest}
              >
                <Undo2 className="size-4" aria-hidden />
                {undoPending ? "Undoing…" : "Undo latest"}
              </Button>
            </Box>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>Record salary increment</DialogTitle>
            <DialogDescription>
              Saves history and updates {employee.pay_type === "salary"
                ? "monthly salary"
                : "hourly rate"}{" "}
              for {employee.full_name}.
            </DialogDescription>
          </DialogHeader>

          <Stack spacing={2} sx={{ py: 1 }}>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Current:{" "}
              <Box component="span" sx={{ ...profileValueSx, fontWeight: 500 }}>
                {formatPayAmount(currentAmount, employee.pay_type, currency)}
              </Box>
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Effective date"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Select
                  label="Type"
                  value={kind}
                  displayEmpty={false}
                  onChange={(e) =>
                    setKind(e.target.value as SalaryIncrementKind)
                  }
                  options={SALARY_INCREMENT_KINDS.map((value) => ({
                    value,
                    label: formatIncrementKind(value),
                  }))}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CurrencyAmountInput
                  id="increment-new-amount"
                  label={
                    employee.pay_type === "salary"
                      ? "New monthly salary"
                      : "New hourly rate"
                  }
                  value={newAmount}
                  onChange={setNewAmount}
                  currency={currency}
                  variant="dashboard"
                />
                {previewDelta != null ? (
                  <Typography
                    sx={{
                      mt: 0.75,
                      fontSize: "0.75rem",
                      color:
                        previewDelta >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    Change: {previewDelta >= 0 ? "+" : ""}
                    {formatMoney(previewDelta, currency)}
                  </Typography>
                ) : null}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Textarea
                  label="Reason (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Annual review, role change…"
                  rows={3}
                />
              </Grid>
            </Grid>
          </Stack>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" disabled={pending} onClick={saveIncrement}>
              {pending ? "Saving…" : "Save increment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function IncrementTimelineRow({
  row,
  currency,
  isLatest,
}: {
  row: SalaryIncrement;
  currency: string;
  isLatest: boolean;
}) {
  const deltaLabel = `${row.increment_amount >= 0 ? "+" : ""}${formatMoney(row.increment_amount, currency)}`;
  const fromLabel = formatPayAmount(row.previous_amount, row.pay_type, currency);
  const toLabel = formatPayAmount(row.new_amount, row.pay_type, currency);

  return (
    <Box component="li" sx={profileTimelineRowSx}>
      <Box sx={profileTimelineMarkerColSx}>
        <Box
          component="span"
          sx={isLatest ? profileTimelineDotSx : profileTimelineDotMutedSx}
          aria-hidden
        />
      </Box>
      <Box sx={profileTimelineContentSx}>
        <Typography sx={{ ...profileValueSx, fontWeight: 500 }}>
          {formatIncrementKind(row.kind)} · {deltaLabel}
        </Typography>
        <Typography sx={{ ...dashboardPageIntroSx, fontSize: "0.875rem" }}>
          {fromLabel} → {toLabel}
          {" · "}
          {formatDateShort(row.effective_date)}
          {row.created_by_name ? ` · by ${row.created_by_name}` : ""}
        </Typography>
        {row.reason ? (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.8125rem",
              color: "text.secondary",
            }}
          >
            {row.reason}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
