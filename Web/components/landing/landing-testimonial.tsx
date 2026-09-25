"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingButton } from "@/components/landing/landing-button";

/**
 * Customer review — Orchid-style card + word reveal on scroll.
 * Scroll: same pattern as landing-hero (tall track, CSS sticky stage, scrub — no GSAP pin).
 */

const QUOTE_TOKENS: { text: string; highlight?: boolean }[] = [
  { text: "Rolling" },
  { text: "out" },
  { text: "Elitebase" },
  { text: "across" },
  { text: "our" },
  { text: "twelve" },
  { text: "locations" },
  { text: "has" },
  { text: "cut", highlight: true },
  { text: "the", highlight: true },
  { text: "friction", highlight: true },
  { text: "of" },
  { text: "manual" },
  { text: "timesheets" },
  { text: "and" },
  { text: "buddy" },
  { text: "punching" },
  { text: "—" },
  { text: "managers" },
  { text: "see" },
  { text: "who's" },
  { text: "on" },
  { text: "the" },
  { text: "floor" },
  { text: "in" },
  { text: "real" },
  { text: "time," },
  { text: "and" },
  { text: "payroll" },
  { text: "exports" },
  { text: "land" },
  { text: "on" },
  { text: "the" },
  { text: "first" },
  { text: "try." },
];

const COLOR_INACTIVE = "#4a5366";
const COLOR_ACTIVE = "#ededed";
const COLOR_HIGHLIGHT = "#2ec4b6";

const SCROLL_TRIGGER_ID = "elite-testimonial-reveal";

/** ~2× viewport scroll while card stays in sticky stage (hero uses ~2.75×). */
const TRACK_VH = 2.15;

function viewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function applyWordColors(words: NodeListOf<HTMLElement>, progress: number) {
  const count = words.length;
  if (count === 0) return;

  const head = progress * count;

  words.forEach((word, index) => {
    const isHighlight = word.dataset.highlight === "true";
    const target = isHighlight ? COLOR_HIGHLIGHT : COLOR_ACTIVE;
    const fill = gsap.utils.clamp(0, 1, head - index);

    if (fill <= 0) {
      word.style.color = COLOR_INACTIVE;
    } else if (fill >= 1) {
      word.style.color = target;
    } else {
      word.style.color = gsap.utils.interpolate(COLOR_INACTIVE, target, fill);
    }
  });
}

export function LandingTestimonial() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const quote = quoteRef.current;
    if (!track || !stage || !quote) return;

    const words = quote.querySelectorAll<HTMLElement>("[data-word]");
    if (!words.length) return;

    gsap.registerPlugin(ScrollTrigger);

    const syncHeights = () => {
      const vh = viewportHeight();
      track.style.height = `${Math.round(vh * TRACK_VH)}px`;
      stage.style.minHeight = `${vh}px`;
    };

    syncHeights();

    let ctx: gsap.Context | undefined;

    const buildScrollTimeline = () => {
      ctx?.revert();
      ScrollTrigger.getById(SCROLL_TRIGGER_ID)?.kill();

      words.forEach((word) => {
        word.style.color = COLOR_INACTIVE;
      });

      ctx = gsap.context(() => {
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: SCROLL_TRIGGER_ID,
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.55,
            invalidateOnRefresh: true,
            onUpdate: (self) => applyWordColors(words, self.progress),
          },
        }).to({}, { duration: 1 });
      }, track);
    };

    buildScrollTimeline();

    const syncScrollScrub = () => {
      syncHeights();
      ScrollTrigger.refresh();
      ScrollTrigger.update();
      const st = ScrollTrigger.getById(SCROLL_TRIGGER_ID);
      if (st) applyWordColors(words, st.progress);
    };

    const rebuild = () => {
      buildScrollTimeline();
      syncScrollScrub();
    };

    syncScrollScrub();
    requestAnimationFrame(syncScrollScrub);
    requestAnimationFrame(() => requestAnimationFrame(syncScrollScrub));

    const delayedSyncIds = [50, 150, 350, 700, 1200].map((ms) =>
      window.setTimeout(syncScrollScrub, ms)
    );

    const onLoad = () => syncScrollScrub();
    const onPageShow = () => syncScrollScrub();

    window.addEventListener("load", onLoad);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", rebuild, { passive: true });
    window.visualViewport?.addEventListener("resize", rebuild);
    void document.fonts?.ready.then(syncScrollScrub);

    return () => {
      delayedSyncIds.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("resize", rebuild);
      window.visualViewport?.removeEventListener("resize", rebuild);
      ctx?.revert();
    };
  }, []);

  return (
    <section
      id="testimonials"
      className="relative"
      aria-labelledby="landing-testimonial-heading"
    >
      <h2 id="landing-testimonial-heading" className="sr-only">
        Customer review
      </h2>

      {/* Scroll track — height set in JS; CTAs live outside so they never scrub */}
      <div ref={trackRef} className="relative">
        <div
          ref={stageRef}
          className="sticky top-0 flex items-center justify-center px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="relative mx-auto w-full max-w-205">
            <div
              className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-linear-to-b from-(--eb-accent)/20 via-transparent to-transparent opacity-80 blur-sm sm:rounded-[2rem]"
              aria-hidden
            />

            <div className="relative isolate rounded-[1.75rem] border border-(--eb-border) bg-(--eb-surface)/70 px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:rounded-[2rem] sm:px-9 sm:py-10 lg:px-11 lg:py-11">
              <div className="flex flex-col items-center text-center">
                <span className="inline-flex items-center rounded-full border border-(--eb-accent)/35 bg-(--eb-elevated)/80 px-4 py-1.5 text-[0.8125rem] font-normal tracking-[-0.01em] text-(--eb-text) sm:text-sm">
                  What our customers are saying
                </span>

                {/* Wrapper pt/pb reserves bands for absolute quotes so ” never overlaps copy */}
                <div className="relative mt-6 w-full max-w-160 pt-[clamp(3rem,7vw,4.25rem)] pb-[clamp(3rem,7vw,4.25rem)] sm:mt-7">
                  <span
                    className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 select-none font-serif text-[clamp(3.25rem,9vw,5.75rem)] leading-none text-(--eb-text)/11"
                    aria-hidden
                  >
                    {"\u201C"}
                  </span>

                  <p
                    ref={quoteRef}
                    className="relative z-1 my-0 text-pretty px-1 text-[clamp(1.0625rem,2.2vw+0.5rem,1.6875rem)] font-normal italic leading-[1.48] tracking-[-0.02em] sm:leading-[1.42] lg:text-[1.75rem]"
                  >
                    {QUOTE_TOKENS.map((token, index) => (
                      <span key={`${token.text}-${index}`}>
                        <span
                          data-word
                          data-highlight={token.highlight ? "true" : "false"}
                          className="inline"
                          style={{ color: COLOR_INACTIVE }}
                        >
                          {token.text}
                        </span>
                        {index < QUOTE_TOKENS.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </p>

                  <span
                    className="pointer-events-none absolute  left-1/2 z-0 -translate-x-1/2 select-none font-serif text-[clamp(3.25rem,9vw,5.75rem)] leading-none text-(--eb-text)/11"
                    aria-hidden
                  >
                    {"\u201D"}
                  </span>
                </div>

                <div className="mt-8 inline-flex max-w-full items-center gap-2.5 rounded-full border border-black/5 bg-(--eb-cta-secondary) py-1.5 pl-1.5 pr-4 sm:gap-3 sm:py-2 sm:pl-2 sm:pr-5">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-(--eb-accent)/25 to-(--eb-surface) text-xs font-semibold text-(--eb-cta-secondary-fg) sm:size-10 sm:text-sm"
                    aria-hidden
                  >
                    SC
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold tracking-[-0.02em] text-(--eb-accent-dark)">
                      Harbor &amp; Co.
                    </p>
                    <p className="text-xs text-(--eb-muted) sm:text-[0.8125rem]">
                      Sarah Chen, Operations Director
                    </p>
                  </div>
                  <span
                    className="mx-0.5 hidden h-6 w-px shrink-0 bg-black/10 sm:block"
                    aria-hidden
                  />
                  <span className="hidden shrink-0 text-sm font-semibold tracking-tight text-(--eb-cta-secondary-fg) sm:block">
                    H&amp;Co
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-5 pb-16 pt-2 sm:flex-row sm:justify-center sm:gap-4 sm:pb-20">
        <LandingButton href="/register" variant="light" size="hero">
          Get started free
        </LandingButton>
        <LandingButton href="#features" variant="accent" size="hero">
          See how it works
        </LandingButton>
      </div>
    </section>
  );
}
