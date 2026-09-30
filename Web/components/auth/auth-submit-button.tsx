"use client";

import { useFormStatus } from "react-dom";
import { LatticeLoader } from "@/components/ui/lattice-loader";
import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
};

/** Pill CTA matching landing `eb-btn` — for auth forms (not links). */
export function AuthSubmitButton({
  idleLabel,
  pendingLabel,
  disabled,
  className,
  onClick,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled || pending);

  return (
    <button
      type="submit"
      disabled={isDisabled ? true : undefined}
      onClick={onClick}
      className={cn(
        "eb-btn group relative w-full rounded-full p-px disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <span className="eb-btn__content eb-btn__content--accent relative flex w-full items-center justify-center overflow-hidden rounded-full px-7 py-3.5 text-[15px] font-medium text-white">
        <span className="relative z-[1] inline-flex items-center justify-center gap-2">
          {pending ? (
            <>
              <LatticeLoader size="sm" className="text-white/90" />
              {pendingLabel}
            </>
          ) : (
            idleLabel
          )}
        </span>
        <span
          className="eb-btn__bg eb-btn__bg--accent absolute inset-0 rounded-full opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-disabled:opacity-0"
          aria-hidden
        />
      </span>
    </button>
  );
}
