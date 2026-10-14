"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createPortalLeaveRequest } from "@/app/portal/(app)/leave/actions";
import { getUserFacingError } from "@/lib/errors/user-facing";

const LEAVE_TYPES = [
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick" },
  { value: "personal", label: "Personal" },
  { value: "unpaid", label: "Unpaid" },
] as const;

const fieldClass =
  "w-full rounded-lg border border-[var(--eb-border)] bg-[var(--eb-elevated)] px-3 py-2.5 text-sm text-[var(--eb-text)] outline-none focus:border-[var(--eb-gold-500)]";

export function PortalLeaveForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [requestType, setRequestType] = useState("vacation");
  const [reason, setReason] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const result = await createPortalLeaveRequest({
          startDate,
          endDate: endDate || startDate,
          requestType,
          reason,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess(true);
        setStartDate("");
        setEndDate("");
        setReason("");
        setRequestType("vacation");
        router.refresh();
      } catch (caught) {
        setError(getUserFacingError(caught));
      }
    });
  }

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        borderRadius: "14px",
        border: "1px solid var(--eb-border)",
        bgcolor: "var(--eb-surface)",
        px: 2.25,
        py: 2.25,
      }}
    >
      <Typography
        sx={{ fontWeight: 560, color: "var(--eb-text)", mb: 0.5 }}
      >
        Request leave
      </Typography>
      <Typography sx={{ color: "var(--eb-muted)", fontSize: "0.875rem", mb: 2 }}>
        Your manager will review pending requests.
      </Typography>

      <Stack spacing={1.75}>
        {error ? (
          <Typography
            role="alert"
            sx={{ color: "#FCA5A5", fontSize: "0.875rem" }}
          >
            {error}
          </Typography>
        ) : null}
        {success ? (
          <Typography
            role="status"
            sx={{ color: "#86EFAC", fontSize: "0.875rem" }}
          >
            Leave request submitted.
          </Typography>
        ) : null}

        <label className="block space-y-1.5 text-sm text-[var(--eb-muted)]">
          <span>Type</span>
          <select
            className={fieldClass}
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
            disabled={pending}
            required
          >
            {LEAVE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm text-[var(--eb-muted)]">
            <span>Start date</span>
            <input
              type="date"
              className={fieldClass}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              disabled={pending}
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm text-[var(--eb-muted)]">
            <span>End date</span>
            <input
              type="date"
              className={fieldClass}
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              disabled={pending}
            />
          </label>
        </div>

        <label className="block space-y-1.5 text-sm text-[var(--eb-muted)]">
          <span>Reason (optional)</span>
          <textarea
            className={`${fieldClass} min-h-[88px] resize-y`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={pending}
            maxLength={500}
            placeholder="Anything your manager should know"
          />
        </label>

        <Button
          type="submit"
          disabled={pending}
          variant="contained"
          sx={{
            alignSelf: "flex-start",
            borderRadius: 999,
            textTransform: "none",
            px: 2.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          {pending ? "Submitting…" : "Submit request"}
        </Button>
      </Stack>
    </Box>
  );
}
