import { Card, CardContent } from "@/components/ui/card";

import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

import { cn } from "@/lib/utils";

import type { ReactNode } from "react";



export type StatsCardTrend = {

  label: string;

  tone?: StatusTone;

};



export type StatsCardProps = {

  icon?: ReactNode;

  label: string;

  value: string | number;

  trend?: StatsCardTrend;

  className?: string;

  /** `dark` matches dashboard ink/teal shell; default `light` for legacy pages. */

  variant?: "light" | "dark";

};



export function StatsCard({

  icon,

  label,

  value,

  trend,

  className,

  variant = "light",

}: StatsCardProps) {

  const isDark = variant === "dark";



  return (

    <Card

      className={cn(

        isDark &&

          "border-[var(--eb-border)] bg-[var(--eb-surface)]/80 ring-[var(--eb-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm",

        className

      )}

    >

      <CardContent className="py-5">

        <div className="flex items-start justify-between gap-3">

          <div className="flex min-w-0 items-start gap-3">

            {icon ? (

              <div

                className={cn(

                  "flex size-10 shrink-0 items-center justify-center rounded-[10px]",

                  isDark

                    ? "border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-accent)]"

                    : "rounded-lg bg-blue-50 text-blue-600"

                )}

              >

                {icon}

              </div>

            ) : null}

            <div className="min-w-0">

              <p

                className={cn(

                  "text-sm font-medium",

                  isDark ? "text-[var(--eb-muted)]" : "text-slate-500"

                )}

              >

                {label}

              </p>

              <p

                className={cn(

                  "mt-1 text-3xl font-semibold tracking-tight",

                  isDark ? "text-[var(--eb-text)]" : "text-slate-900"

                )}

              >

                {value}

              </p>

            </div>

          </div>

          {trend ? (

            <StatusBadge tone={trend.tone ?? "neutral"} theme={isDark ? "dark" : "light"}>

              {trend.label}

            </StatusBadge>

          ) : null}

        </div>

      </CardContent>

    </Card>

  );

}

