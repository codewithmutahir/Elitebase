"use client";

import { useEffect, useRef } from "react";
import { LandingButton } from "@/components/landing/landing-button";

const brands = [
  "Riverside Café",
  "Northline Retail",
  "Harbor & Co.",
  "Summit Clinics",
  "Bluebird Logistics",
  "Metro Kitchen Group",
  "Fieldstone Care",
  "Coastline Hospitality",
] as const;

function BrandMark({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        flexShrink: 0,
        whiteSpace: "nowrap",
        marginLeft: "2.25rem",
        marginRight: "2.25rem",
        fontSize: "clamp(1.25rem, 1.5vw, 1.65rem)",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "rgba(255,255,255,0.45)",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}

/** Horizontal logo strip — layout is inline so CSS/media-query bugs cannot wrap it into a pile. */
export function LandingBrands() {
  const trackRef = useRef<HTMLDivElement>(null);
  // Two identical sequences for a seamless -50% loop
  const sequence = [...brands, ...brands];

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let x = 0;
    const speed = 0.45; // px per frame ~27px/s at 60fps

    const tick = () => {
      const half = el.scrollWidth / 2;
      if (half > 0) {
        x -= speed;
        if (x <= -half) x += half;
        el.style.transform = `translate3d(${x}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      className="relative pt-10 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-[4.5rem]"
      aria-labelledby="landing-brands-heading"
    >
      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
          <div className="shrink-0 text-center lg:max-w-[15rem] lg:text-left xl:max-w-[17rem]">
            <h2
              id="landing-brands-heading"
              className="text-balance text-[1.65rem] font-normal leading-[1.2] tracking-[-0.02em] text-[var(--eb-text)] sm:text-[1.85rem] lg:text-[2rem]"
            >
              Trusted by teams on the floor
            </h2>
          </div>

          <div className="relative min-w-0 flex-1">
            <div
              className="relative overflow-hidden"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
                maskImage:
                  "linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)",
              }}
            >
              <div
                ref={trackRef}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  width: "max-content",
                  willChange: "transform",
                  paddingTop: "0.5rem",
                  paddingBottom: "0.5rem",
                }}
              >
                {sequence.map((name, i) => (
                  <BrandMark key={`${name}-${i}`} name={name} />
                ))}
              </div>
            </div>

            <p className="sr-only">{brands.join(", ")}</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center lg:mt-14">
          <LandingButton href="#stats" variant="ghost" size="hero">
            Why Elitebase exists
          </LandingButton>
        </div>
      </div>
    </section>
  );
}
