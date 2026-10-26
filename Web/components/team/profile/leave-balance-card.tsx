"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustEmployeeLeaveBalance } from "@/app/(dashboard)/employees/leave-balance-actions";
import { PendingButton } from "@/components/dashboard/pending-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import {
  dashboardAlertErrorSx,
  dashboardCardSx,
  dashboardPageIntroSx,
  dashboardSectionTitleSx,
  profileFieldLabelSx,
  profileValueSx,
} from "@/lib/dashboard/sx";
import type { LeaveBalanceView } from "@/lib/leave-balance/types";
import type { LeaveBalanceAdjustmentRow } from "@/lib/leave-balance/queries";

type LeaveBalanceCardProps = {
  employeeId: string;
  balance: LeaveBalanceView;
  adjustments: LeaveBalanceAdjustmentRow[];
};

export function LeaveBalanceCard({
  employeeId,
  balance,
  adjustments,
}: LeaveBalanceCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<"sick" | "paid">("paid");
  const [field, setField] = useState<"total" | "used">("total");
  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState("");

  function onAdjust() {
    setError(null);
    const amount = Number(delta);
    if (!Number.isInteger(amount) || amount === 0) {
      setError("Enter a non-zero whole number (use negative to decrease).");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Enter a reason (at least 3 characters).");
      return;
    }

    startTransition(async () => {
      const result = await adjustEmployeeLeaveBalance({
        employeeId,
        year: balance.year,
        bucket,
        field,
        delta: amount,
        reason,
      });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setReason("");
      toast.success("Leave balance updated");
      router.refresh();
    });
  }

  return (
    <Card sx={dashboardCardSx}>
      <CardHeader>
        <Typography component="h2" sx={dashboardSectionTitleSx}>
          Leave balance ({balance.year})
        </Typography>
        <Typography sx={dashboardPageIntroSx}>
          Sick and paid allotments for this leave year. Approving leave deducts
          automatically; adjust manually only with a reason.
        </Typography>
      </CardHeader>
      <CardContent>
        <Stack spacing={3}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            <BalanceStat
              label="Sick remaining"
              value={`${balance.sickRemaining} / ${balance.sickTotal}`}
            />
            <BalanceStat
              label="Paid remaining"
              value={`${balance.paidRemaining} / ${balance.paidTotal}`}
            />
            <BalanceStat
              label="Total remaining"
              value={`${balance.totalRemaining} / ${balance.totalAllotted}`}
            />
          </Box>

          <Stack spacing={1.5}>
            <Typography sx={profileFieldLabelSx}>Manual adjustment</Typography>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr 1fr",
                },
              }}
            >
              <Select
                id="leave-bucket"
                label="Bucket"
                value={bucket}
                onChange={(e) =>
                  setBucket(e.target.value as "sick" | "paid")
                }
                options={[
                  { value: "sick", label: "Sick" },
                  { value: "paid", label: "Paid" },
                ]}
              />
              <Select
                id="leave-field"
                label="Field"
                value={field}
                onChange={(e) =>
                  setField(e.target.value as "total" | "used")
                }
                options={[
                  { value: "total", label: "Allotment (total)" },
                  { value: "used", label: "Used" },
                ]}
              />
              <Input
                id="leave-delta"
                label="Delta (+/−)"
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </Box>
            <Input
              id="leave-reason"
              label="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Carry-over correction from prior employer"
            />
            {error ? (
              <Typography component="p" sx={dashboardAlertErrorSx}>
                {error}
              </Typography>
            ) : null}
            <Box>
              <PendingButton
                type="button"
                pending={pending}
                onClick={onAdjust}
              >
                Apply adjustment
              </PendingButton>
            </Box>
          </Stack>

          {adjustments.length > 0 ? (
            <Stack spacing={1}>
              <Typography sx={profileFieldLabelSx}>Recent adjustments</Typography>
              <Stack spacing={0.75} component="ul" sx={{ m: 0, pl: 2 }}>
                {adjustments.map((row) => (
                  <Typography
                    key={row.id}
                    component="li"
                    sx={{ ...profileValueSx, fontSize: "0.8125rem" }}
                  >
                    {row.created_at.slice(0, 10)} · {row.bucket}/{row.field}{" "}
                    {row.delta > 0 ? `+${row.delta}` : row.delta} — {row.reason}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: "1px solid var(--eb-border)",
        bgcolor: "action.hover",
        px: 2,
        py: 1.5,
      }}
    >
      <Typography sx={{ ...profileFieldLabelSx, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ ...profileValueSx, fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}
