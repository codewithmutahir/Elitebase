"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
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
import { cn } from "@/lib/utils";

type SheetSide = "top" | "right" | "bottom" | "left";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error("Sheet components must be used within <Sheet>");
  }
  return ctx;
}

type SheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: SheetProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  }

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { setOpen } = useSheetContext();

  function handleClick(event: MouseEvent) {
    (props.onClick as ((e: MouseEvent) => void) | undefined)?.(event);
    if (!event.defaultPrevented) setOpen(true);
  }

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...(props as object),
      children,
      onClick: handleClick,
    } as never);
  }

  return (
    <button type="button" data-slot="sheet-trigger" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function SheetClose({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { setOpen } = useSheetContext();

  function handleClick(event: MouseEvent) {
    (props.onClick as ((e: MouseEvent) => void) | undefined)?.(event);
    if (!event.defaultPrevented) setOpen(false);
  }

  if (isValidElement(render)) {
    return cloneElement(render, {
      ...(props as object),
      children,
      onClick: handleClick,
    } as never);
  }

  return (
    <button type="button" data-slot="sheet-close" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function SheetPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function SheetOverlay(_props?: HTMLAttributes<HTMLDivElement>) {
  void _props;
  return null;
}

function paperSideSx(side: SheetSide) {
  if (side === "left" || side === "right") {
    return {
      width: { xs: "100%", sm: 384 },
      maxWidth: "100%",
      height: "100%",
    };
  }
  return {
    width: "100%",
    maxHeight: "85vh",
  };
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  overlayClassName,
  variant = "default",
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  side?: SheetSide;
  showCloseButton?: boolean;
  overlayClassName?: string;
  /** Dashboard product sheets (portaled — use with dashboard-sheet tokens) */
  variant?: "default" | "dashboard";
}) {
  const { open, setOpen } = useSheetContext();
  void props;
  const isDashboard = variant === "dashboard";

  const paperAnchorSx =
    side === "right"
      ? { left: "auto", right: 0 }
      : side === "left"
        ? { left: 0, right: "auto" }
        : {};

  return (
    <MuiDrawer
      anchor={side}
      open={open}
      onClose={() => setOpen(false)}
      data-slot="sheet"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      slotProps={{
        backdrop: {
          className: overlayClassName,
        },
        paper: {
          "data-slot": "sheet-content",
          className: cn(
            isDashboard &&
              "dashboard-sheet border-[var(--eb-border)] bg-[var(--eb-surface)] text-[var(--eb-text)]",
            className
          ),
          style,
          sx: {
            backgroundImage: "none",
            ...(isDashboard
              ? {
                  backgroundColor: "var(--eb-surface)",
                  color: "var(--eb-text)",
                  borderColor: "var(--eb-border)",
                }
              : {
                  backgroundColor: "background.paper",
                  color: "text.primary",
                  borderColor: "divider",
                }),
            display: "flex",
            flexDirection: "column",
            gap: 0,
            boxSizing: "border-box",
            borderLeft: side === "right" ? "1px solid" : undefined,
            borderRight: side === "left" ? "1px solid" : undefined,
            ...paperAnchorSx,
            ...paperSideSx(side),
          },
        },
      }}
    >
      {showCloseButton ? (
        <IconButton
          data-slot="sheet-close"
          aria-label="Close"
          onClick={() => setOpen(false)}
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1,
            color: "text.secondary",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
      {children}
    </MuiDrawer>
  );
}

function SheetHeader({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      data-slot="sheet-header"
      className={className}
      style={style}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function SheetFooter({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      data-slot="sheet-footer"
      className={className}
      style={style}
      sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 1 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function SheetTitle({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Typography
      data-slot="sheet-title"
      className={className}
      style={style}
      component="h2"
      variant="subtitle1"
      sx={{ fontWeight: 500, color: "text.primary" }}
      {...props}
    >
      {children}
    </Typography>
  );
}

function SheetDescription({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Typography
      data-slot="sheet-description"
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
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
