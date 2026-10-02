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

export type TextareaProps = Omit<
  ComponentProps<"textarea">,
  "color" | "size"
> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
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
      rows = 3,
      ...rest
    },
    ref
  ) {
    const fieldId = id ?? name;
    const hasMeta = Boolean(label || hint || error);

    const field = (
      <TextField
        inputRef={ref}
        id={fieldId}
        name={name}
        multiline
        minRows={rows}
        data-slot="textarea"
        className={className}
        style={style}
        value={value}
        defaultValue={defaultValue}
        onChange={
          onChange as
            | ((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void)
            | undefined
        }
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        error={Boolean(error)}
        fullWidth
        size="small"
        slotProps={{
          htmlInput: {
            readOnly,
            ...rest,
          },
        }}
      />
    );

    if (!hasMeta) {
      return field;
    }

    return (
      <Stack spacing={0.75} data-slot="textarea-field">
        {label ? (
          <FormLabel htmlFor={fieldId} data-slot="label">
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
  }
);

export { Textarea };
