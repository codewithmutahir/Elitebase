import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BRAND_ICON,
  BRAND_LOGO_ON_DARK,
} from "@/lib/brand/assets";

type ElitebaseLogoProps = {
  variant?: "wordmark" | "icon";
  className?: string;
  href?: string;
  priority?: boolean;
  onClick?: () => void;
};

const wordmarkSizes = { width: 148, height: 32 };
const iconSizes = { width: 32, height: 32 };

export function ElitebaseLogo({
  variant = "wordmark",
  className,
  href = "/",
  priority = false,
  onClick,
}: ElitebaseLogoProps) {
  const src = variant === "icon" ? BRAND_ICON : BRAND_LOGO_ON_DARK;
  const sizes = variant === "icon" ? iconSizes : wordmarkSizes;
  const label = variant === "icon" ? "Elitebase" : "Elitebase home";

  const image = (
    <Image
      src={src}
      alt=""
      width={sizes.width}
      height={sizes.height}
      priority={priority}
      className={cn(
        "h-auto w-auto max-h-8 shrink-0",
        variant === "wordmark" && "max-w-[148px]",
        variant === "icon" && "max-h-8 max-w-8",
        className
      )}
    />
  );

  if (!href) {
    return (
      <span className="inline-flex items-center" aria-hidden={variant === "icon"}>
        {image}
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("inline-flex items-center no-underline", className)}
      aria-label={label}
    >
      {image}
    </Link>
  );
}
