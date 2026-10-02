"use client";

import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { getCurrencySymbol } from "@/lib/money/format";

type CurrencyAmountInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  className?: string;
  /** Uses denser dashboard chrome; colors still come from the MUI theme. */
  variant?: "default" | "dashboard";
};

export function CurrencyAmountInput({
  id,
  label,
  value,
  onChange,
  currency,
  className,
  variant = "default",
}: CurrencyAmountInputProps) {
  const symbol = getCurrencySymbol(currency);
  const isDashboard = variant === "dashboard";

  return (
    <Stack spacing={0.75} className={className} data-variant={variant}>
      <FormLabel
        htmlFor={id}
        sx={
          isDashboard
            ? {
                typography: "caption",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "text.secondary",
              }
            : { typography: "caption", fontWeight: 600, color: "text.secondary" }
        }
      >
        {label}
      </FormLabel>
      <TextField
        id={id}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        size="small"
        slotProps={{
          htmlInput: { min: 0, step: 0.01 },
          input: {
            startAdornment: (
              <InputAdornment position="start">{symbol}</InputAdornment>
            ),
          },
        }}
      />
    </Stack>
  );
}
