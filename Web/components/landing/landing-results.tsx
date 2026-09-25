"use client";

import { SpotlightCard } from "@/components/ui/spotlight-card";

const resultCards = [
  {
    id: "clock-in",
    lead: "Speed up average kiosk clock-in to",
    value: "10 sec",
    detail:
      "PIN-first flow built for busy shift changes—employees punch in at the door without downloading an app or waiting on a manager.",
    span: "tall" as const,
  },
  {
    id: "uptime",
    lead: "Keep every location online with uptime at",
    value: "99.9%",
    detail:
      "Reliable cloud infrastructure for every site—clock-ins, exports, and live dashboards stay available when shift change hits hardest.",
    span: "default" as const,
  },
  {
    id: "businesses",
    lead: "Join operators nationwide already on",
    value: "500+",
    detail:
      "Retail, hospitality, and field teams use Elitebase for shift-by-shift visibility—from the kiosk to payroll-ready exports.",
    span: "default" as const,
  },
] as const;

/** Gradient applies across numeric + unit segments (Orchid-style). */
function GradientStat({ value }: { value: string }) {
  const segments = value.match(/[\d.]+%?|[a-zA-Z]+|\+|\s+/g) ?? [value];

  return (
    <p
      className="text-[clamp(3.25rem,11vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.04em] sm:text-[clamp(3.5rem,9vw,6.25rem)] lg:text-[clamp(4rem,5.5vw,7.5rem)]"
      aria-label={value}
    >
      {segments.map((segment, index) => {
        if (/^\s+$/.test(segment)) {
          return <span key={`space-${index}`}>&nbsp;</span>;
        }
        return (
          <span key={`${segment}-${index}`} className="eb-stat-gradient">
            {segment}
          </span>
        );
      })}
    </p>
  );
}

function ResultCard({
  lead,
  value,
  detail,
  span,
}: (typeof resultCards)[number]) {
  const isTall = span === "tall";

  return (
    <SpotlightCard
      className={[
        "flex h-full flex-col rounded-[1.75rem] border-[var(--eb-border)] bg-[var(--eb-surface)]/45 p-7 backdrop-blur-md sm:p-8 lg:p-10",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        "transition-[border-color,background-color] duration-300 hover:bg-[var(--eb-surface)]/55",
        isTall ? "lg:row-span-2 lg:min-h-[32rem]" : "lg:min-h-[15.25rem]",
      ].join(" ")}
    >
      <p
        className={[
          "max-w-[18rem] text-pretty text-[1.0625rem] font-normal leading-[1.35] tracking-[-0.01em] text-[var(--eb-text)] sm:text-lg lg:max-w-[20rem] lg:text-[1.125rem]",
          isTall ? "sm:max-w-[22rem]" : "",
        ].join(" ")}
      >
        {lead}
      </p>

      <div className="mt-6 sm:mt-7 lg:mt-8">
        <GradientStat value={value} />
      </div>

      <div className="min-h-4 flex-1" aria-hidden />

      <p className="max-w-[22rem] text-sm leading-relaxed text-[var(--eb-muted)] sm:text-[0.9375rem] lg:max-w-[26rem]">
        {detail}
      </p>
    </SpotlightCard>
  );
}

export function LandingResults() {
  return (
    <section
      id="stats"
      className="relative py-20 sm:py-24 lg:py-28"
      aria-labelledby="landing-results-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="max-w-max">
          <span className="inline-flex items-center rounded-full border border-[var(--eb-accent)]/35 bg-[var(--eb-surface)]/40 px-4 py-1.5 text-[0.8125rem] font-normal tracking-[-0.01em] text-[var(--eb-text)] backdrop-blur-sm sm:px-5 sm:py-2 sm:text-sm">
            What teams achieve
          </span>
          <h2 id="landing-results-heading" className="sr-only">
            Real results on every shift
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:mt-10 sm:gap-6 lg:mt-12 lg:grid-cols-2 lg:grid-rows-2 lg:gap-6">
          {resultCards.map((card) => (
            <ResultCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
