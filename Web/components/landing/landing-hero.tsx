"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SplitText } from "@/components/landing/split-text";

const DESKTOP_HERO_MQL = "(min-width: 1024px)";

/** Orchid-matched two-phase hero scroll on lg+ only; mobile = copy + CTAs, no mockup. */
export function LandingHero() {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const copy = copyRef.current;
    const frame = frameRef.current;
    const glow = glowRef.current;
    const frameWrap = frameWrapRef.current;
    if (!track || !stage || !copy) return;

    const desktopMql = window.matchMedia(DESKTOP_HERO_MQL);
    const isDesktop = () => desktopMql.matches;

    const viewportHeight = () =>
      window.visualViewport?.height ?? window.innerHeight;

    const syncHeroHeights = () => {
      const vh = viewportHeight();
      if (isDesktop()) {
        track.style.height = `${Math.round(vh * 2.75)}px`;
      } else {
        track.style.height = "";
      }
      stage.style.height = `${vh}px`;
    };
    syncHeroHeights();

    gsap.registerPlugin(ScrollTrigger);

    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    html.classList.add("landing-scroll-lock");

    ScrollTrigger.getById("elite-hero-zoom")?.kill();

    const PHASE_RISE = 0.35;

    const getNavBottom = () => {
      const nav = document.querySelector("[data-landing-navbar]");
      if (nav) return nav.getBoundingClientRect().bottom;
      return isDesktop() ? 78 : 64;
    };

    const getRiseY = () => {
      if (!frameWrap) return 0;
      const navBottom = getNavBottom();
      const gap = 16;
      const targetTop = navBottom + gap;
      const peekTop = frameWrap.offsetTop;
      return targetTop - peekTop;
    };

    const getMaxScale = () => 1.25;

    /** Reload mid-page restores scroll before scrub runs — skip entrance so it doesn't reset the mockup to y:0. */
    const shouldPlayEntrance = () => window.scrollY < 48;

    let entranceTl: gsap.core.Timeline | undefined;

    if (shouldPlayEntrance()) {
      entranceTl = gsap.timeline({ delay: 0.3 });

      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, { opacity: 0, y: 20 });
        entranceTl.to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          0.15
        );
      }

      if (ctaRef.current) {
        gsap.set(ctaRef.current, { opacity: 0, y: 20 });
        entranceTl.to(
          ctaRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          0.3
        );
      }

      if (frame && isDesktop()) {
        gsap.set(frame, { opacity: 0, y: 40 });
        entranceTl.to(
          frame,
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          0.45
        );
      }
    } else {
      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, { opacity: 1, y: 0 });
      }
      if (ctaRef.current) {
        gsap.set(ctaRef.current, { opacity: 1, y: 0 });
      }
      if (frame && isDesktop()) {
        gsap.set(frame, { opacity: 1, y: 0 });
      }
    }

    let ctx: gsap.Context | undefined;

    const buildScrollTimeline = () => {
      ctx?.revert();
      ScrollTrigger.getById("elite-hero-zoom")?.kill();

      if (!isDesktop() || !frame || !frameWrap) {
        gsap.set(copy, { autoAlpha: 1, y: 0, clearProps: "transform" });
        if (frame) gsap.set(frame, { clearProps: "all" });
        if (glow) gsap.set(glow, { clearProps: "all" });
        return;
      }

      ctx = gsap.context(() => {
        gsap.set(copy, { autoAlpha: 1, force3D: true });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "elite-hero-zoom",
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        tl.to(
          frame,
          { y: () => getRiseY(), scale: 1, duration: PHASE_RISE },
          0
        );

        tl.to(
          copy,
          {
            autoAlpha: 0,
            y: -32,
            duration: PHASE_RISE * 0.75,
          },
          0.03
        );

        if (glow) {
          tl.to(
            glow,
            { opacity: 0.65, scale: 1.05, duration: PHASE_RISE },
            0
          );
        }

        tl.to(
          frame,
          { scale: () => getMaxScale(), duration: 1 - PHASE_RISE },
          PHASE_RISE
        );

        if (glow) {
          tl.to(
            glow,
            { opacity: 0.9, scale: 1.35, duration: 1 - PHASE_RISE },
            PHASE_RISE
          );
        }
      }, track);
    };

    buildScrollTimeline();

    const syncScrollScrub = () => {
      syncHeroHeights();
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    };

    const rebuild = () => {
      buildScrollTimeline();
      syncScrollScrub();
    };

    const onDesktopChange = () => rebuild();

    syncScrollScrub();
    requestAnimationFrame(syncScrollScrub);
    requestAnimationFrame(() => requestAnimationFrame(syncScrollScrub));

    const delayedSyncIds = [50, 150, 350, 700].map((ms) =>
      window.setTimeout(syncScrollScrub, ms)
    );

    const onLoad = () => syncScrollScrub();
    const onPageShow = () => syncScrollScrub();

    window.addEventListener("load", onLoad);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", rebuild, { passive: true });
    window.visualViewport?.addEventListener("resize", rebuild);
    desktopMql.addEventListener("change", onDesktopChange);
    void document.fonts?.ready.then(syncScrollScrub);

    return () => {
      delayedSyncIds.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("resize", rebuild);
      window.visualViewport?.removeEventListener("resize", rebuild);
      desktopMql.removeEventListener("change", onDesktopChange);
      html.style.scrollBehavior = prevBehavior;
      html.classList.remove("landing-scroll-lock");
      entranceTl?.kill();
      ctx?.revert();
    };
  }, []);

  return (
    <>
      <LandingNavbar />

      <section
        ref={trackRef}
        className="landing-hero relative bg-transparent lg:min-h-0 min-h-[100dvh]"
        aria-label="Elitebase product overview"
      >
        <div ref={stageRef} className="sticky top-0 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 z-[1] hidden lg:block"
            aria-hidden
          >
            <div
              ref={glowRef}
              className="absolute left-1/2 top-[18%] h-[70vmax] w-[90vmax] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(47,78,162,0.14) 0%, rgba(217,166,63,0.06) 42%, transparent 68%)",
              }}
            />
          </div>

          <div className="relative z-[5] mx-auto flex h-full min-h-[100dvh] w-full max-w-[720px] flex-col items-center justify-center px-5 pb-12 pt-[5.25rem] sm:px-6 lg:min-h-0 lg:justify-start lg:pb-0 lg:pt-[11.5rem]">
            <div
              ref={copyRef}
              className="hero-copy flex w-full max-w-[540px] flex-col items-center text-center"
            >
              <h1 className="text-balance text-[clamp(2rem,8.2vw,2.85rem)] font-normal leading-[1.14] tracking-[-0.02em] text-[#ededed] lg:text-[clamp(2.25rem,4.2vw,2.85rem)] lg:leading-[1.12]">
                <SplitText
                  text="Your team, always on time."
                  splitType="chars"
                  delay={25}
                  duration={0.6}
                  ease="power3.out"
                  from={{ opacity: 0, y: 28, rotateX: 40 }}
                  to={{ opacity: 1, y: 0, rotateX: 0 }}
                />
              </h1>
              <p
                ref={subtitleRef}
                className="mt-5 max-w-[34rem] text-pretty text-[15px] leading-[1.65] text-[#b8becc] sm:mt-6 sm:text-base sm:leading-[1.6]"
              >
                Elitebase helps employers manage attendance with a simple
                dashboard and on-site kiosk — PIN clock-in, optional face
                verification, and timesheets in one place.
              </p>
              <div
                ref={ctaRef}
                className="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-10 lg:max-w-none lg:flex-row lg:items-center lg:justify-center lg:gap-4"
              >
                <LandingButton
                  href="/register"
                  variant="accent"
                  size="hero"
                  className="w-full lg:w-auto"
                >
                  Get started free
                </LandingButton>
                <LandingButton
                  href="#features"
                  variant="ghost"
                  size="hero"
                  className="w-full lg:w-auto"
                >
                  See how it works
                </LandingButton>
              </div>
            </div>
          </div>

          <div
            ref={frameWrapRef}
            className="pointer-events-none absolute inset-x-0 top-[72%] z-10 hidden justify-center lg:flex"
          >
            <div
              ref={frameRef}
              className="hero-frame w-[min(92vw,920px)] will-change-transform"
              style={{ transformOrigin: "50% 0%" }}
            >
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
