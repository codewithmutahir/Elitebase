"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { muiAlpha } from "@/lib/mui/alpha";

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
                color: "primary.main",
                textUnderlineOffset: 2,
                textDecoration: "none",
                "&:hover": {
                  color: "text.primary",
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
              color="primary"
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
                  color: "primary.main",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1.125rem",
                },
                "&.Mui-focusVisible": {
                  outline: (theme) =>
                    `2px solid ${muiAlpha(theme, (p) => p.primary.main, 0.35)}`,
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
