import { cn } from "@/lib/utils";

/** Micro loader inspired by React Bits lattice-loader — use inside buttons. */
export function LatticeLoader({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "lattice-loader inline-grid grid-cols-3 gap-0.5 text-current",
        size === "md" && "gap-1",
        className
      )}
      aria-hidden
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "lattice-loader__dot rounded-[2px] bg-current",
            size === "sm" ? "size-1" : "size-1.5"
          )}
          style={{ animationDelay: `${index * 0.07}s` }}
        />
      ))}
    </span>
  );
}
