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
        "mb-6 rounded-lg px-4 py-3 text-sm",
        variant === "error" && "bg-red-50 text-red-700",
        variant === "success" && "bg-emerald-50 text-emerald-800",
        className
      )}
      role="alert"
    >
      {children}
    </p>
  );
}
