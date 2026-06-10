import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AuthFormCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthFormCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthFormCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10",
        className
      )}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? <div className="mt-8 border-t border-slate-100 pt-6">{footer}</div> : null}
    </div>
  );
}
