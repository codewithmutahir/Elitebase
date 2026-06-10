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
};

export function StatsCard({
  icon,
  label,
  value,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {value}
              </p>
            </div>
          </div>
          {trend ? (
            <StatusBadge tone={trend.tone ?? "neutral"}>{trend.label}</StatusBadge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
