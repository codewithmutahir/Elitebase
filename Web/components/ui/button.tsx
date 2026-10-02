"use client";

import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";

export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Base UI–compatible slot: render as another element (e.g. `<Link />`). */
  render?: ReactElement;
  children?: ReactNode;
  sx?: SxProps<Theme>;
};

function mapVariant(
  variant: ButtonVariant
): Pick<MuiButtonProps, "variant" | "color"> {
  switch (variant) {
    case "outline":
      return { variant: "outlined", color: "primary" };
    case "secondary":
      return { variant: "contained", color: "secondary" };
    case "ghost":
      return { variant: "ghost", color: "inherit" };
    case "destructive":
      return { variant: "contained", color: "error" };
    case "link":
      return { variant: "link", color: "primary" };
    case "default":
    default:
      return { variant: "contained", color: "primary" };
  }
}

function mapSize(size: ButtonSize): MuiButtonProps["size"] {
  switch (size) {
    case "xs":
      return "xs";
    case "sm":
      return "small";
    case "lg":
      return "large";
    case "icon":
      return "icon";
    case "icon-xs":
      return "icon-xs";
    case "icon-sm":
      return "icon-sm";
    case "icon-lg":
      return "icon-lg";
    case "default":
    default:
      return "medium";
  }
}

/**
 * Compatibility helper kept for callers that still import `buttonVariants`.
 * Styling now lives in the MUI theme; this only forwards `className`.
 */
function buttonVariants(options?: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  className?: string;
}): string {
  return options?.className ?? "";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      render,
      children,
      style,
      disabled,
      sx,
      ...props
    },
    ref
  ) {
    const mapped = mapVariant(variant);
    const muiSize = mapSize(size);
    const hasRender = isValidElement(render);

    const slotProps =
      hasRender ?
        {
          component: render.type as ElementType,
          ...(render.props as Record<string, unknown>),
        }
      : {};

    return (
      <MuiButton
        ref={ref}
        data-slot="button"
        type={hasRender ? undefined : type}
        className={className}
        style={style}
        disabled={disabled}
        variant={mapped.variant}
        color={mapped.color}
        size={muiSize}
        sx={sx}
        {...slotProps}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

export { Button, buttonVariants };
