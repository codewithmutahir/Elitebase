"use client";

import MuiAvatar from "@mui/material/Avatar";
import MuiAvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import {
  Children,
  forwardRef,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";

type AvatarSize = "default" | "sm" | "lg";

type AvatarProps = ComponentProps<"div"> & {
  size?: AvatarSize;
  children?: ReactNode;
};

function isElementOfType(
  child: ReactNode,
  type: unknown
): child is ReactElement {
  return isValidElement(child) && child.type === type;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { className, style, size = "default", children, ...props },
  ref
) {
  let src: string | undefined;
  let alt: string | undefined;
  let fallback: ReactNode;
  const extras: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isElementOfType(child, AvatarImage)) {
      src = (child.props as { src?: string }).src;
      alt = (child.props as { alt?: string }).alt;
      return;
    }
    if (isElementOfType(child, AvatarFallback)) {
      fallback = (child.props as { children?: ReactNode }).children;
      return;
    }
    extras.push(child);
  });

  return (
    <MuiAvatar
      ref={ref}
      data-slot="avatar"
      data-size={size}
      className={className}
      style={style}
      src={src}
      alt={alt}
      {...props}
    >
      {fallback}
      {extras}
    </MuiAvatar>
  );
});

function AvatarImage({
  className: _className,
  ..._props
}: ComponentProps<"img">) {
  void _className;
  void _props;
  return null;
}

function AvatarFallback({
  className: _className,
  children: _children,
  ..._props
}: ComponentProps<"div">) {
  void _className;
  void _children;
  void _props;
  // Parsed by Avatar parent via element props; not mounted in the tree.
  return null;
}

function AvatarBadge({ className, style, children, ...props }: ComponentProps<"span">) {
  return (
    <Box
      component="span"
      data-slot="avatar-badge"
      className={className}
      style={style}
      sx={{
        position: "absolute",
        right: 0,
        bottom: 0,
        zIndex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        ring: 2,
        width: 10,
        height: 10,
        '[data-size="sm"] &': { width: 8, height: 8 },
        '[data-size="lg"] &': { width: 12, height: 12 },
      }}
      {...props}
    >
      {children}
    </Box>
  );
}

function AvatarGroup({ className, style, children, ...props }: ComponentProps<"div">) {
  return (
    <MuiAvatarGroup
      data-slot="avatar-group"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </MuiAvatarGroup>
  );
}

function AvatarGroupCount({
  className,
  style,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <MuiAvatar
      data-slot="avatar-group-count"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </MuiAvatar>
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
};
