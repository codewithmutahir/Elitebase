"use client";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { forwardRef, useState, type InputHTMLAttributes } from "react";

export type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Reference-style auth input: placeholder label, gold focus ring, dark fill. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    { label, hint, error, className, id, name, required, style, ...props },
    ref
  ) {
    const fieldId = id ?? name;
    const placeholder =
      required || props["aria-required"] ? `${label} *` : label;

    const {
      type,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      disabled,
      autoComplete,
      autoFocus,
      readOnly,
      min,
      max,
      step,
      ...rest
    } = props;

    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

    return (
      <Box className={className} sx={{ minWidth: 0 }} style={style}>
        <TextField
          inputRef={ref}
          id={fieldId}
          name={name}
          type={inputType}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange as never}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          error={Boolean(error)}
          fullWidth
          aria-label={label}
          slotProps={{
            htmlInput: {
              readOnly,
              min,
              max,
              step,
              "aria-invalid": error ? true : undefined,
              "aria-required": props["aria-required"],
              ...rest,
            },
            inputLabel: { shrink: false },
            input: isPassword
              ? {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        edge="end"
                        size="small"
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(event) => event.preventDefault()}
                        sx={{ color: "var(--eb-muted)" }}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              : undefined,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              minHeight: 44,
              borderRadius: "10px",
              bgcolor: "var(--eb-navy-950)",
              color: "var(--eb-text)",
              fontSize: "0.875rem",
              "& fieldset": {
                borderColor: "var(--eb-border)",
              },
              "&:hover fieldset": {
                borderColor: "var(--eb-border)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--eb-gold-500)",
                borderWidth: 1,
                boxShadow:
                  "0 0 0 2px color-mix(in srgb, var(--eb-gold-500) 25%, transparent)",
              },
              "&.Mui-error.Mui-focused fieldset": {
                boxShadow: "0 0 0 2px rgba(248, 113, 113, 0.2)",
              },
            },
            "& .MuiInputBase-input": {
              color: "var(--eb-text)",
              WebkitTextFillColor: "var(--eb-text)",
              caretColor: "var(--eb-gold-500)",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "var(--eb-muted)",
              opacity: 1,
              WebkitTextFillColor: "var(--eb-muted)",
            },
          }}
        />
        {error ? (
          <FormHelperText error role="alert" sx={{ mt: 0.75, mx: 0 }}>
            {error}
          </FormHelperText>
        ) : hint ? (
          <FormHelperText sx={{ mt: 0.75, mx: 0, color: "text.secondary" }}>
            {hint}
          </FormHelperText>
        ) : null}
      </Box>
    );
  }
);
