import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import type { ReactNode } from "react";



export type StatusTone =

  | "success"

  | "warning"

  | "error"

  | "info"

  | "neutral";



const toneStylesLight: Record<StatusTone, string> = {

  success: "border-emerald-200 bg-emerald-50 text-emerald-700",

  warning: "border-amber-200 bg-amber-50 text-amber-700",

  error: "border-red-200 bg-red-50 text-red-700",

  info: "border-blue-200 bg-blue-50 text-blue-700",

  neutral: "border-slate-200 bg-slate-100 text-slate-600",

};



const toneStylesDark: Record<StatusTone, string> = {

  success:
    "border-emerald-500/35 bg-emerald-500/10 text-[var(--eb-status-success-fg,#34d399)]",

  warning:
    "border-amber-500/35 bg-amber-500/10 text-[var(--eb-status-warning-fg,#fbbf24)]",

  error:
    "border-red-500/35 bg-red-500/10 text-[var(--eb-status-error-fg,#f87171)]",

  info: "border-[var(--eb-accent)]/35 bg-[var(--eb-accent)]/10 text-[var(--eb-accent)]",

  neutral:
    "border-[var(--eb-border)] bg-[var(--eb-hover-overlay)] text-[var(--eb-muted)]",

};



export function StatusBadge({

  tone = "neutral",

  theme = "light",

  className,

  children,

}: {

  tone?: StatusTone;

  theme?: "light" | "dark";

  className?: string;

  children: ReactNode;

}) {

  const styles = theme === "dark" ? toneStylesDark : toneStylesLight;



  return (

    <Badge variant="outline" className={cn(styles[tone], className)}>

      {children}

    </Badge>

  );

}

