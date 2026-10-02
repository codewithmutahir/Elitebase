"use client";

import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import SelectMui, {
  type SelectChangeEvent,
  type SelectProps as MuiSelectProps,
} from "@mui/material/Select";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: SelectChangeEvent<string>) => void;
  disabled?: boolean;
  required?: boolean;
  displayEmpty?: boolean;
  /** Placeholder when value is empty (only if options omit an empty value) */
  emptyLabel?: string;
  options: SelectOption[];
  className?: string;
  sx?: SxProps<Theme>;
  fullWidth?: boolean;
  size?: "small" | "medium";
  minWidth?: number | string;
};

export type { SelectChangeEvent };

export function Select({
  id,
  name,
  label,
  hint,
  error,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  displayEmpty = true,
  emptyLabel = "Select…",
  options,
  className,
  sx,
  fullWidth = true,
  size = "small",
  minWidth,
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const hasEmptyInOptions = options.some((option) => option.value === "");
  const showPlaceholder = displayEmpty && !hasEmptyInOptions;

  const isControlled = value !== undefined;
  const selectValueProps: Pick<MuiSelectProps<string>, "value" | "defaultValue"> =
    isControlled
      ? { value: value ?? "" }
      : defaultValue !== undefined
        ? { defaultValue }
        : { defaultValue: "" };

  const selectControl = (
    <FormControl
      fullWidth={fullWidth}
      size={size}
      error={Boolean(error)}
      required={required}
      sx={[
        minWidth != null ? { minWidth } : null,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <SelectMui<string>
        id={fieldId}
        name={name}
        displayEmpty={displayEmpty}
        disabled={disabled}
        onChange={onChange}
        {...selectValueProps}
        data-slot="select"
        MenuProps={{
          sx: { zIndex: (t: Theme) => t.zIndex.modal + 2 },
          slotProps: {
            paper: {
              className: "dashboard-dropdown",
              sx: {
                backgroundImage: "none",
                backgroundColor: "var(--eb-surface)",
                color: "var(--eb-text)",
                borderColor: "var(--eb-border)",
              },
            },
          },
        }}
      >
        {showPlaceholder ? (
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem
            key={option.value === "" ? "__empty" : option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </SelectMui>
      {error ? (
        <FormHelperText>{error}</FormHelperText>
      ) : hint ? (
        <FormHelperText>{hint}</FormHelperText>
      ) : null}
    </FormControl>
  );

  if (!label) {
    return (
      <div data-slot="select-field" className={className}>
        {selectControl}
      </div>
    );
  }

  return (
    <Stack data-slot="select-field" useFlexGap spacing={0.75} className={className}>
      <FormLabel htmlFor={fieldId} data-slot="label">
        {label}
      </FormLabel>
      {selectControl}
    </Stack>
  );
}
