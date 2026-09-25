import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RegisterRoleCardProps = {
  href: string;
  title: string;
  description: string;
  bullets: readonly string[];
  icon: LucideIcon;
  featured?: boolean;
};

export function RegisterRoleCard({
  href,
  title,
  description,
  bullets,
  icon: Icon,
  featured,
}: RegisterRoleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col rounded-[1.25rem] border p-6 transition-[border-color,box-shadow,transform] duration-200 sm:rounded-[1.5rem] sm:p-8",
        "border-[var(--eb-border)] bg-[var(--eb-surface)]/50 backdrop-blur-md",
        "hover:-translate-y-0.5 hover:border-[var(--eb-accent)]/35 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(46,196,182,0.08)]",
        featured &&
          "border-[var(--eb-accent)]/25 bg-[var(--eb-surface)]/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_40px_rgba(46,196,182,0.08)]"
      )}
    >
      {featured ? (
        <span className="absolute right-5 top-5 rounded-full border border-[var(--eb-accent)]/30 bg-[var(--eb-accent)]/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-[var(--eb-accent)]">
          Most teams start here
        </span>
      ) : null}

      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl border border-[var(--eb-border)] bg-[var(--eb-elevated)] text-[var(--eb-accent)] transition-colors group-hover:border-[var(--eb-accent)]/30 group-hover:bg-[var(--eb-accent)]/10",
          featured && "border-[var(--eb-accent)]/25"
        )}
      >
        <Icon className="size-6" strokeWidth={1.5} aria-hidden />
      </div>

      <h2 className="mt-6 text-xl font-medium tracking-[-0.02em] text-[var(--eb-text)] sm:text-[1.35rem]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--eb-muted)] sm:text-[0.9375rem]">
        {description}
      </p>

      <ul className="mt-5 space-y-2.5 border-t border-[var(--eb-border)] pt-5">
        {bullets.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-[var(--eb-text)]/85"
          >
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--eb-accent)]"
              aria-hidden
            />
            {item}
          </li>
        ))}
      </ul>

      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--eb-accent)] transition-colors group-hover:text-[var(--eb-text)]">
        Continue
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
