"use client";

import CloseIcon from "@mui/icons-material/Close";
import MuiDialog from "@mui/material/Dialog";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiDialogContentText from "@mui/material/DialogContentText";
import MuiDialogTitle from "@mui/material/DialogTitle";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("Dialog components must be used within <Dialog>");
  }
  return ctx;
}

type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  }

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { setOpen } = useDialogContext();

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
    <button type="button" data-slot="dialog-trigger" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function DialogPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DialogOverlay(_props?: HTMLAttributes<HTMLDivElement>) {
  void _props;
  return null;
}

function DialogClose({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { setOpen } = useDialogContext();

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
    <button type="button" data-slot="dialog-close" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  onClick,
}: HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
}) {
  const { open, setOpen } = useDialogContext();

  return (
    <MuiDialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          className,
          style,
          onClick,
          sx: {
            position: "relative",
            borderRadius: 3,
            p: 2,
            gap: 2,
            display: "grid",
          },
        },
      }}
    >
      {showCloseButton ? (
        <IconButton
          data-slot="dialog-close"
          aria-label="Close"
          onClick={() => setOpen(false)}
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
      {children}
    </MuiDialog>
  );
}

function DialogHeader({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Box
      data-slot="dialog-header"
      className={className}
      style={style}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
      {...props}
    >
      {children}
    </Box>
  );
}

function DialogFooter({
  className,
  style,
  children,
  showCloseButton = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  showCloseButton?: boolean;
}) {
  const { setOpen } = useDialogContext();

  return (
    <MuiDialogActions
      data-slot="dialog-footer"
      className={className}
      style={style}
      sx={{
        px: 0,
        pb: 0,
        pt: 1,
        gap: 1,
        flexDirection: { xs: "column-reverse", sm: "row" },
        justifyContent: "flex-end",
      }}
      {...props}
    >
      {children}
      {showCloseButton ? (
        <Button variant="outline" onClick={() => setOpen(false)}>
          Close
        </Button>
      ) : null}
    </MuiDialogActions>
  );
}

function DialogTitle({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <MuiDialogTitle
      data-slot="dialog-title"
      className={className}
      style={style}
      component={"h2" as ElementType}
      sx={{ p: 0, fontSize: "1rem", fontWeight: 500, lineHeight: 1.25 }}
      {...props}
    >
      {children}
    </MuiDialogTitle>
  );
}

function DialogDescription({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <MuiDialogContentText
      data-slot="dialog-description"
      className={className}
      style={style}
      sx={{ m: 0, typography: "body2", color: "text.secondary" }}
      {...props}
    >
      {children}
    </MuiDialogContentText>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
