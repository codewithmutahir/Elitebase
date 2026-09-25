import { cn } from "@/lib/utils";

type AuthAlertProps = {
  variant: "error" | "success";
  children: React.ReactNode;
  className?: string;
};

export function AuthAlert({ variant, children, className }: AuthAlertProps) {
  return (
    <p
      className={cn(
        "mb-6 rounded-lg border px-4 py-3 text-sm",
        variant === "error" &&
          "border-red-500/30 bg-red-500/10 text-red-200",
        variant === "success" &&
          "border-[var(--eb-accent)]/30 bg-[var(--eb-accent)]/10 text-[var(--eb-text)]",
        className
      )}
      role="alert"
    >
      {children}
    </p>
  );
}
