"use client";

import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {
  forwardRef,
  type ChangeEvent,
  type ComponentProps,
} from "react";

export type InputProps = Omit<ComponentProps<"input">, "color" | "size"> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    type,
    label,
    hint,
    error,
    id,
    style,
    name,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    disabled,
    required,
    readOnly,
    autoComplete,
    autoFocus,
    min,
    max,
    step,
    ...rest
  },
  ref
) {
  const inputId = id ?? name;
  const hasMeta = Boolean(label || hint || error);

  const field = (
    <TextField
      inputRef={ref}
      id={inputId}
      name={name}
      type={type}
      data-slot="input"
      className={className}
      style={style}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange as ((e: ChangeEvent<HTMLInputElement>) => void) | undefined}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={Boolean(error)}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      fullWidth
      size="small"
      slotProps={{
        htmlInput: {
          readOnly,
          min,
          max,
          step,
          ...rest,
        },
      }}
    />
  );

  if (!hasMeta) {
    return field;
  }

  return (
    <Stack useFlexGap spacing={0.75} data-slot="input-field">
      {label ? (
        <FormLabel htmlFor={inputId} data-slot="label">
          {label}
        </FormLabel>
      ) : null}
      {field}
      {error ? (
        <FormHelperText error>{error}</FormHelperText>
      ) : hint ? (
        <FormHelperText>{hint}</FormHelperText>
      ) : null}
    </Stack>
  );
});

export { Input };
