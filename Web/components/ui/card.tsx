"use client";

import MuiCard from "@mui/material/Card";
import MuiCardActions from "@mui/material/CardActions";
import MuiCardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";

type DivProps = ComponentProps<"div"> & {
  size?: "default" | "sm";
  sx?: ComponentProps<typeof MuiCard>["sx"];
};

const Card = forwardRef<HTMLDivElement, DivProps>(function Card(
  { className, size = "default", style, children, sx, ...props },
  ref
) {
  return (
    <MuiCard
      ref={ref}
      data-slot="card"
      data-size={size}
      className={className}
      style={style}
      sx={sx}
      {...props}
    >
      {children}
    </MuiCard>
  );
});

const CardHeader = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { sx?: ComponentProps<typeof Box>["sx"] }
>(function CardHeader({ className, style, children, sx, ...props }, ref) {
  return (
    <Box
      ref={ref}
      data-slot="card-header"
      className={className}
      style={style}
      sx={[
        {
          display: "grid",
          autoRows: "min-content",
          alignItems: "start",
          gap: 0.5,
          px: 2,
          '[data-size="sm"] &': { px: 1.5 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
});

const CardTitle = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { sx?: ComponentProps<typeof Typography>["sx"] }
>(function CardTitle({ className, style, children, sx, ...props }, ref) {
  return (
    <Typography
      ref={ref}
      data-slot="card-title"
      component="div"
      className={className}
      style={style}
      sx={[
        {
          fontWeight: 500,
          fontSize: "1rem",
          lineHeight: 1.375,
          '[data-size="sm"] &': { fontSize: "0.875rem" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Typography>
  );
});

const CardDescription = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { sx?: ComponentProps<typeof Typography>["sx"] }
>(function CardDescription({ className, style, children, sx, ...props }, ref) {
  return (
    <Typography
      ref={ref}
      data-slot="card-description"
      component="div"
      variant="body2"
      color="text.secondary"
      className={className}
      style={style}
      sx={sx}
      {...props}
    >
      {children}
    </Typography>
  );
});

const CardAction = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { sx?: ComponentProps<typeof Box>["sx"] }
>(function CardAction({ className, style, children, sx, ...props }, ref) {
  return (
    <Box
      ref={ref}
      data-slot="card-action"
      className={className}
      style={style}
      sx={[
        {
          gridColumnStart: 2,
          gridRow: "1 / span 2",
          justifySelf: "end",
          alignSelf: "start",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
});

const CardContent = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { sx?: ComponentProps<typeof MuiCardContent>["sx"] }
>(function CardContent({ className, style, children, sx, ...props }, ref) {
  return (
    <MuiCardContent
      ref={ref}
      data-slot="card-content"
      className={className}
      style={style}
      sx={[
        {
          px: 2,
          py: 0,
          '[data-size="sm"] &': { px: 1.5 },
          "&:last-child": { pb: 0 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </MuiCardContent>
  );
});

const CardFooter = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    children?: ReactNode;
    sx?: ComponentProps<typeof MuiCardActions>["sx"];
  }
>(function CardFooter({ className, style, children, sx, ...props }, ref) {
  return (
    <MuiCardActions
      ref={ref}
      data-slot="card-footer"
      className={className}
      style={style}
      sx={[
        {
          px: 2,
          py: 2,
          mt: "auto",
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "action.hover",
          '[data-size="sm"] &': { p: 1.5 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {children}
    </MuiCardActions>
  );
});

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
