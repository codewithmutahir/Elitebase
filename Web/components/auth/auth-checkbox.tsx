"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
type AuthCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className" | "color"
> & {
  children: ReactNode;
  className?: string;
  error?: string;
};

export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  function AuthCheckbox(
    {
      children,
      className,
      id,
      error,
      checked,
      onChange,
      onBlur,
      name,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <Box className={className} sx={{ minWidth: 0 }}>
        <FormControlLabel
          sx={{
            alignItems: "flex-start",
            m: 0,
            gap: 0.5,
            "& .MuiFormControlLabel-label": {
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "text.secondary",
              pt: 0.25,
              "& a": {
                fontWeight: 500,
                color: "var(--eb-gold-300)",
                textUnderlineOffset: 2,
                textDecoration: "none",
                "&:hover": {
                  color: "var(--eb-gold-500)",
                  textDecoration: "underline",
                },
              },
            },
          }}
          control={
            <Checkbox
              id={id}
              name={name}
              checked={Boolean(checked)}
              onChange={(event) => {
                onChange?.(event);
              }}
              disabled={disabled}
              size="small"
              slotProps={{
                input: {
                  ref,
                  onBlur,
                  "aria-invalid": error ? true : undefined,
                  ...props,
                },
              }}
              sx={{
                p: 0.5,
                color: "divider",
                "&.Mui-checked": {
                  color: "var(--eb-gold-500)",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.125rem",
                },
                "&.Mui-focusVisible": {
                  outline:
                    "2px solid color-mix(in srgb, var(--eb-gold-500) 35%, transparent)",
                  outlineOffset: 2,
                },
              }}
            />
          }
          label={children}
        />
        {error ? (
          <FormHelperText
            error
            role="alert"
            sx={{ mt: 0.75, ml: 3.5, mx: 0 }}
          >
            {error}
          </FormHelperText>
        ) : null}
      </Box>
    );
  }
);
