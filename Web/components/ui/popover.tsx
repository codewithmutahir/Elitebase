"use client";

import Box from "@mui/material/Box";
import MuiPopover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error("Popover components must be used within <Popover>");
  }
  return ctx;
}

function mapOrigin(side: Side, align: Align) {
  const horizontal =
    side === "left" || side === "right"
      ? side === "left"
        ? "right"
        : "left"
      : align === "start"
        ? "left"
        : align === "end"
          ? "right"
          : "center";

  const vertical =
    side === "top" || side === "bottom"
      ? side === "top"
        ? "bottom"
        : "top"
      : align === "start"
        ? "top"
        : align === "end"
          ? "bottom"
          : "center";

  const anchorHorizontal =
    side === "left" || side === "right"
      ? side
      : align === "start"
        ? "left"
        : align === "end"
          ? "right"
          : "center";

  const anchorVertical =
    side === "top" || side === "bottom"
      ? side
      : align === "start"
        ? "top"
        : align === "end"
          ? "bottom"
          : "center";

  return {
    anchorOrigin: {
      vertical: anchorVertical as "top" | "center" | "bottom",
      horizontal: anchorHorizontal as "left" | "center" | "right",
    },
    transformOrigin: {
      vertical: vertical as "top" | "center" | "bottom",
      horizontal: horizontal as "left" | "center" | "right",
    },
  };
}

type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = openProp ?? uncontrolled;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    if (!next) setAnchorEl(null);
  }

  return (
    <PopoverContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { open, setOpen, setAnchorEl } = usePopoverContext();

  function handleClick(event: MouseEvent<HTMLElement>) {
    (props.onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(
      event
    );
    if (event.defaultPrevented) return;
    const el = event.currentTarget;
    if (open) {
      setOpen(false);
    } else {
      setAnchorEl(el);
      setOpen(true);
    }
  }

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...(props as object),
      children: children ?? (render.props as { children?: ReactNode }).children,
      onClick: handleClick,
      "aria-haspopup": "dialog",
      "aria-expanded": open,
    } as never);
  }

  return (
    <button
      type="button"
      data-slot="popover-trigger"
      aria-haspopup="dialog"
      aria-expanded={open}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

function PopoverContent({
  className,
  children,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  style,
}: HTMLAttributes<HTMLDivElement> & {
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
}) {
  const { open, setOpen, anchorEl } = usePopoverContext();
  const origins = mapOrigin(side, align);
  void alignOffset;

  return (
    <MuiPopover
      open={open && Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setOpen(false)}
      anchorOrigin={origins.anchorOrigin}
      transformOrigin={origins.transformOrigin}
      slotProps={{
        paper: {
          className,
          style,
          sx: {
            p: 1.25,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundImage: "none",
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            minWidth: 288,
            mt: side === "bottom" ? `${sideOffset}px` : undefined,
            mb: side === "top" ? `${sideOffset}px` : undefined,
            ml: side === "right" ? `${sideOffset}px` : undefined,
            mr: side === "left" ? `${sideOffset}px` : undefined,
          },
        },
      }}
    >
      {children}
    </MuiPopover>
  );
}

function PopoverHeader({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      data-slot="popover-header"
      className={className}
      style={style}
      sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function PopoverTitle({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Typography
      data-slot="popover-title"
      className={className}
      style={style}
      component="h3"
      variant="subtitle2"
      sx={{ fontWeight: 500 }}
      {...props}
    >
      {children}
    </Typography>
  );
}

function PopoverDescription({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Typography
      data-slot="popover-description"
      className={className}
      style={style}
      variant="body2"
      color="text.secondary"
      {...props}
    >
      {children}
    </Typography>
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
