"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PortalPayslipsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const year = params.get("year") ?? "";
  const month = params.get("month") ?? "";
  const q = params.get("q") ?? "";

  function apply(next: { year?: string; month?: string; q?: string }) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) sp.delete(key);
      else sp.set(key, value);
    }
    startTransition(() => {
      router.push(`/portal/payslips?${sp.toString()}`);
    });
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      useFlexGap
      sx={{ flexWrap: "wrap", alignItems: { sm: "flex-end" } }}
    >
      <Box sx={{ minWidth: 120, flex: 1 }}>
        <Input
          id="payslip-year"
          label="Year"
          type="number"
          defaultValue={year}
          onBlur={(e) => apply({ year: e.target.value.trim(), month, q })}
        />
      </Box>
      <Box sx={{ minWidth: 120, flex: 1 }}>
        <Input
          id="payslip-month"
          label="Month"
          type="number"
          min={1}
          max={12}
          defaultValue={month}
          onBlur={(e) => apply({ year, month: e.target.value.trim(), q })}
        />
      </Box>
      <Box sx={{ minWidth: 160, flex: 2 }}>
        <Input
          id="payslip-q"
          label="Search"
          placeholder="Period label…"
          defaultValue={q}
          onBlur={(e) => apply({ year, month, q: e.target.value.trim() })}
        />
      </Box>
      <Button
        type="button"
        variant="outline"
        disabled={pending || (!year && !month && !q)}
        onClick={() => {
          startTransition(() => router.push("/portal/payslips"));
        }}
      >
        Clear filters
      </Button>
    </Stack>
  );
}

export function PortalPayslipPrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="print:hidden portal-print-hide"
    >
      Print / Save PDF
    </Button>
  );
}
