"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { fromCents } from "@/lib/money/cents";
import { formatMoney } from "@/lib/money/format";
import type { CalculatePayslipResult } from "@/lib/payslips/calculate";

export type PayslipDocumentMeta = {
  companyName: string;
  companyAddress?: string | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  logoUrl?: string | null;
  currency?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  applyCompanyStamp?: boolean;
};

type PayslipDocumentProps = {
  data: CalculatePayslipResult;
  meta: PayslipDocumentMeta;
  /** Employer edit mode shows override affordances via children slots later. */
  mode?: "readonly" | "edit";
};

function money(cents: number, currency: string | null | undefined) {
  return formatMoney(fromCents(cents), currency);
}

function Row({
  label,
  value,
  emphasize,
  negative,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
  negative?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
        gap: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        py: 1,
        px: { xs: 1, sm: 1.5 },
        bgcolor: emphasize ? "action.hover" : "transparent",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: emphasize ? 700 : 500,
          color: "text.primary",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: emphasize ? 700 : 500,
          fontVariantNumeric: "tabular-nums",
          textAlign: "right",
          color: negative ? "error.main" : "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Shared Excel-faithful payslip layout (employer edit + employee read-only).
 */
export function PayslipDocument({
  data,
  meta,
  mode = "readonly",
}: PayslipDocumentProps) {
  const currency = meta.currency;
  const address = [meta.companyAddress].filter(Boolean).join("\n");
  void mode;

  return (
    <Box
      sx={{
        position: "relative",
        mx: "auto",
        maxWidth: 720,
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "text.primary",
      }}
      data-payslip-document
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: { xs: 2, sm: 3 },
          py: 2.5,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          {meta.logoUrl ? (
            <Image
              src={meta.logoUrl}
              alt=""
              width={56}
              height={56}
              unoptimized
              style={{
                width: 56,
                height: "auto",
                maxHeight: 56,
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : null}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
              {meta.companyName}
            </Typography>
            {address ? (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  whiteSpace: "pre-line",
                }}
              >
                {address}
              </Typography>
            ) : null}
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
              {[meta.phonePrimary, meta.phoneSecondary]
                .filter(Boolean)
                .join(" · ")}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Box
        sx={{
          bgcolor: "action.hover",
          px: { xs: 2, sm: 3 },
          py: 1.25,
          textAlign: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
          Salary Slip for the Month of {data.payPeriodLabel}
        </Typography>
      </Box>

      <Box sx={{ py: 0.5 }}>
        <Row label="Employee Name" value={data.employeeName} />
        <Row
          label="Leave Balance"
          value={`${data.leaveBalance.totalRemaining} (Sick ${data.leaveBalance.sickRemaining}, Paid ${data.leaveBalance.paidRemaining})`}
        />
        <Row label="Day off" value={data.dayOffLabel} />
        <Row label="Working Days in a Month" value={data.workingDays} />
        <Row
          label="Salary"
          value={money(data.baseSalaryCents, currency)}
        />
        <Row
          label="Accrued Bonus"
          value={
            data.bonusAccruedCents
              ? money(data.bonusAccruedCents, currency)
              : "—"
          }
        />
        <Row
          label="Bonus Policy"
          value={data.bonusPolicyLabel || "—"}
        />
        <Row
          label="Salary Per Day"
          value={money(data.salaryPerDayCents, currency)}
        />
        <Row
          label="Leaves Deduction"
          value={
            data.leaveDeductionCents
              ? `(${money(data.leaveDeductionCents, currency)})`
              : "—"
          }
          negative={data.leaveDeductionCents > 0}
        />
        <Row
          label="Lates"
          value={`${data.lateCount} (${data.lateDaysDeducted} day${data.lateDaysDeducted === 1 ? "" : "s"} · rem ${data.lateRemainder})`}
        />
        <Row
          label="Late Deduction"
          value={
            data.lateDeductionCents
              ? `(${money(data.lateDeductionCents, currency)})`
              : "—"
          }
          negative={data.lateDeductionCents > 0}
        />
        <Row
          label="Loan Balance"
          value={money(data.loanBalanceBeforeCents, currency)}
        />
        <Row
          label="Loan Deduction"
          value={
            data.loanDeductionCents
              ? `(${money(data.loanDeductionCents, currency)})`
              : "—"
          }
          negative={data.loanDeductionCents > 0}
        />
        <Row
          label="Allowances"
          value={money(data.allowancesTotalCents, currency)}
        />
        <Row
          label="Net Salary"
          value={money(data.netSalaryCents, currency)}
          emphasize
        />
      </Box>

      {data.netClamped || data.warnings.length > 0 ? (
        <Box sx={{ px: 2, py: 1.5 }}>
          {data.warnings.map((w) => (
            <Typography
              key={w}
              sx={{ fontSize: "0.75rem", color: "warning.main" }}
            >
              {w}
            </Typography>
          ))}
        </Box>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          borderTop: "1px solid",
          borderColor: "divider",
          px: { xs: 2, sm: 3 },
          py: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Reviewed by
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {meta.reviewedByName || "—"}
          </Typography>
          {meta.reviewedAt ? (
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
              {meta.reviewedAt.slice(0, 10)}
            </Typography>
          ) : null}
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
            Approved By
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
            {meta.approvedByName || "—"}
          </Typography>
          {meta.approvedAt ? (
            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
              {meta.approvedAt.slice(0, 10)}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Box
        sx={{
          position: "relative",
          minHeight: 88,
          borderTop: "1px dashed",
          borderColor: "divider",
          px: 2,
          py: 2,
        }}
      >
        <Typography
          sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}
        >
          Company Stamp
        </Typography>
        {meta.applyCompanyStamp && meta.logoUrl ? (
          <Box
            sx={{
              position: "absolute",
              right: 24,
              bottom: 12,
              opacity: 0.35,
              transform: "rotate(-12deg)",
              pointerEvents: "none",
            }}
          >
            <Image
              src={meta.logoUrl}
              alt="Company stamp"
              width={96}
              height={96}
              unoptimized
              style={{
                width: 96,
                height: "auto",
                maxHeight: 96,
                objectFit: "contain",
              }}
            />
          </Box>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
            {meta.applyCompanyStamp
              ? "Stamp enabled — upload a company logo in Settings to display it."
              : "No stamp applied"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
