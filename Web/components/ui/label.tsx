"use client";

import FormLabel from "@mui/material/FormLabel";
import { forwardRef, type LabelHTMLAttributes, type ReactNode } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, style, children, htmlFor, color: _color, ...props },
  ref
) {
  void _color;
  return (
    <FormLabel
      ref={ref}
      data-slot="label"
      className={className}
      style={style}
      htmlFor={htmlFor}
      {...props}
    >
      {children as ReactNode}
    </FormLabel>
  );
});

export { Label };
