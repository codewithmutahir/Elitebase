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

/** Reference-style auth input: placeholder label, teal focus ring, dark fill. */
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
                        sx={{ color: "text.secondary" }}
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
              bgcolor: "rgba(6, 10, 18, 0.55)",
              color: "text.primary",
              fontSize: "0.875rem",
              "& fieldset": {
                borderColor: "divider",
              },
              "&:hover fieldset": {
                borderColor: "divider",
              },
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                borderWidth: 1,
                boxShadow: "0 0 0 2px rgba(46, 196, 182, 0.25)",
              },
              "&.Mui-error.Mui-focused fieldset": {
                boxShadow: "0 0 0 2px rgba(248, 113, 113, 0.2)",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "text.secondary",
              opacity: 1,
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
