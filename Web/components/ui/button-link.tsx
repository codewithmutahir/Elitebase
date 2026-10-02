"use client";

import Link from "next/link";
import {
  Button,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui/button";
import type { ComponentProps } from "react";

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

export function ButtonLink({
  href,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      render={<Link href={href} {...props} />}
    >
      {children}
    </Button>
  );
}
