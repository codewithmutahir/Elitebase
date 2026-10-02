"use client";

import CheckIcon from "@mui/icons-material/Check";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import MuiMenu from "@mui/material/Menu";
import MuiMenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

type MenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  }
  return ctx;
}

function mapOrigin(side: Side, align: Align) {
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

  const transformHorizontal =
    side === "left" || side === "right"
      ? side === "left"
        ? "right"
        : "left"
      : align === "start"
        ? "left"
        : align === "end"
          ? "right"
          : "center";

  const transformVertical =
    side === "top" || side === "bottom"
      ? side === "top"
        ? "bottom"
        : "top"
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
      vertical: transformVertical as "top" | "center" | "bottom",
      horizontal: transformHorizontal as "left" | "center" | "right",
    },
  };
}

type DropdownMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
};

function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = openProp ?? uncontrolled;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
    if (!next) setAnchorEl(null);
  }

  function close() {
    setOpen(false);
  }

  return (
    <MenuContext.Provider
      value={{ open, setOpen, anchorEl, setAnchorEl, close }}
    >
      {children}
    </MenuContext.Provider>
  );
}

function DropdownMenuPortal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function DropdownMenuTrigger({
  children,
  render,
  ...props
}: {
  children?: ReactNode;
  render?: ReactElement;
} & Record<string, unknown>) {
  const { open, setOpen, setAnchorEl } = useMenuContext();

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
      "aria-haspopup": "menu",
      "aria-expanded": open,
    } as never);
  }

  return (
    <button
      type="button"
      data-slot="dropdown-menu-trigger"
      aria-haspopup="menu"
      aria-expanded={open}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  children,
  style,
}: HTMLAttributes<HTMLDivElement> & {
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
}) {
  const { open, setOpen, anchorEl } = useMenuContext();
  const origins = mapOrigin(side, align);
  void alignOffset;
  const isDashboardMenu = className?.includes("dashboard-dropdown");

  return (
    <MuiMenu
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
            minWidth: 128,
            borderRadius: 2,
            border: "1px solid",
            backgroundImage: "none",
            ...(isDashboardMenu
              ? {
                  borderColor: "var(--eb-border)",
                  backgroundColor: "var(--eb-surface)",
                  color: "var(--eb-text)",
                }
              : {
                  borderColor: "divider",
                }),
            mt: side === "bottom" ? `${sideOffset}px` : undefined,
            mb: side === "top" ? `${sideOffset}px` : undefined,
          },
        },
      }}
    >
      {children}
    </MuiMenu>
  );
}

function DropdownMenuGroup({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="dropdown-menu-group" role="group" {...props}>
      {children}
    </div>
  );
}

function DropdownMenuLabel({
  className,
  style,
  inset,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  inset?: boolean;
  children?: ReactNode;
}) {
  return (
    <ListSubheader
      className={className}
      style={style}
      sx={{
        lineHeight: 1.5,
        py: 1,
        px: inset ? 3.5 : 1.5,
        typography: "caption",
        fontWeight: 500,
        color: "text.secondary",
        backgroundColor: "transparent",
      }}
    >
      {children}
    </ListSubheader>
  );
}

function DropdownMenuItem({
  className,
  style,
  inset,
  variant = "default",
  children,
  render,
  onClick,
  disabled,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  inset?: boolean;
  variant?: "default" | "destructive";
  children?: ReactNode;
  render?: ReactElement;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
} & Record<string, unknown>) {
  const { close } = useMenuContext();

  function handleClick(event: MouseEvent<HTMLElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) close();
  }

  const colorSx =
    variant === "destructive"
      ? {
          color: "error.main",
          "&:hover": {
            backgroundColor: "action.hover",
            color: "error.main",
          },
        }
      : undefined;

  if (isValidElement(render)) {
    const renderProps = render.props as Record<string, unknown>;
    return (
      <MuiMenuItem
        data-slot="dropdown-menu-item"
        data-inset={inset || undefined}
        data-variant={variant}
        className={className}
        style={style}
        disabled={disabled}
        component={render.type as ElementType}
        {...renderProps}
        onClick={(event: MouseEvent<HTMLElement>) => {
          (renderProps.onClick as ((e: MouseEvent<HTMLElement>) => void) | undefined)?.(
            event
          );
          handleClick(event);
        }}
        sx={{
          borderRadius: 1.5,
          mx: 0,
          gap: 1.25,
          minHeight: 40,
          py: 1.25,
          px: 2,
          pl: inset ? 3.5 : 2,
          typography: "body2",
          ...colorSx,
        }}
        {...props}
      >
        {children}
      </MuiMenuItem>
    );
  }

  return (
    <MuiMenuItem
      data-slot="dropdown-menu-item"
      data-inset={inset || undefined}
      data-variant={variant}
      className={className}
      style={style}
      disabled={disabled}
      onClick={handleClick}
      sx={{
        borderRadius: 1.5,
        mx: 0,
        gap: 1.25,
        minHeight: 40,
        py: 1.25,
        px: 2,
        pl: inset ? 3.5 : 2,
        typography: "body2",
        ...colorSx,
      }}
      {...props}
    >
      {children}
    </MuiMenuItem>
  );
}

function DropdownMenuCheckboxItem({
  className,
  style,
  children,
  checked,
  inset,
  onCheckedChange,
  onClick,
  disabled,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  checked?: boolean;
  inset?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
} & Record<string, unknown>) {
  const { close } = useMenuContext();

  return (
    <MuiMenuItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset || undefined}
      className={className}
      style={style}
      disabled={disabled}
      selected={Boolean(checked)}
      onClick={(event) => {
        onClick?.(event);
        onCheckedChange?.(!checked);
        if (!event.defaultPrevented) close();
      }}
      sx={{ pl: inset ? 3.5 : 1.5, typography: "body2" }}
      {...props}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        {checked ? <CheckIcon fontSize="small" /> : null}
      </ListItemIcon>
      <ListItemText
        slotProps={{ primary: { variant: "body2" } }}
      >
        {children}
      </ListItemText>
    </MuiMenuItem>
  );
}

function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
  ...props
}: {
  children?: ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div data-slot="dropdown-menu-radio-group" role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

const RadioGroupContext = createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

function DropdownMenuRadioItem({
  className,
  style,
  children,
  value,
  inset,
  onClick,
  disabled,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  value: string;
  inset?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
} & Record<string, unknown>) {
  const { close } = useMenuContext();
  const group = useContext(RadioGroupContext);
  const checked = group.value === value;

  return (
    <MuiMenuItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset || undefined}
      className={className}
      style={style}
      disabled={disabled}
      selected={checked}
      onClick={(event) => {
        onClick?.(event);
        group.onValueChange?.(value);
        if (!event.defaultPrevented) close();
      }}
      sx={{ pl: inset ? 3.5 : 1.5, typography: "body2" }}
      {...props}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        {checked ? <CheckIcon fontSize="small" /> : null}
      </ListItemIcon>
      <ListItemText
        slotProps={{ primary: { variant: "body2" } }}
      >
        {children}
      </ListItemText>
    </MuiMenuItem>
  );
}

function DropdownMenuSeparator({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Divider
      component="li"
      className={className}
      style={style}
      sx={{ my: 0.5 }}
    />
  );
}

function DropdownMenuShortcut({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <Typography
      data-slot="dropdown-menu-shortcut"
      component="span"
      className={className}
      style={style}
      variant="caption"
      color="text.secondary"
      sx={{ ml: "auto", letterSpacing: "0.08em" }}
      {...props}
    >
      {children}
    </Typography>
  );
}

type SubContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
};

const SubContext = createContext<SubContextValue | null>(null);

function DropdownMenuSub({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <SubContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </SubContext.Provider>
  );
}

function DropdownMenuSubTrigger({
  className,
  style,
  inset,
  children,
  ...props
}: {
  className?: string;
  style?: CSSProperties;
  inset?: boolean;
  children?: ReactNode;
} & Record<string, unknown>) {
  const sub = useContext(SubContext);
  if (!sub) {
    throw new Error("DropdownMenuSubTrigger must be used within DropdownMenuSub");
  }

  return (
    <MuiMenuItem
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset || undefined}
      className={className}
      style={style}
      onClick={(event) => {
        sub.setAnchorEl(event.currentTarget);
        sub.setOpen(true);
      }}
      sx={{ pl: inset ? 3.5 : 1.5, typography: "body2" }}
      {...props}
    >
      {children}
      <ChevronRightIcon fontSize="small" sx={{ ml: "auto" }} />
    </MuiMenuItem>
  );
}

function DropdownMenuSubContent({
  className,
  style,
  children,
  align = "start",
  side = "right",
  sideOffset = 0,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
}) {
  const sub = useContext(SubContext);
  if (!sub) {
    throw new Error("DropdownMenuSubContent must be used within DropdownMenuSub");
  }
  const origins = mapOrigin(side, align);

  return (
    <MuiMenu
      open={sub.open && Boolean(sub.anchorEl)}
      anchorEl={sub.anchorEl}
      onClose={() => sub.setOpen(false)}
      anchorOrigin={origins.anchorOrigin}
      transformOrigin={origins.transformOrigin}
      slotProps={{
        paper: {
          className,
          style,
          sx: {
            minWidth: 96,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundImage: "none",
            ml: side === "right" ? `${sideOffset}px` : undefined,
          },
        },
      }}
    >
      {children}
    </MuiMenu>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
