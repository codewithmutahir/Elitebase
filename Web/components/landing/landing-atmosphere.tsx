"use client";

import { useEffect, useRef } from "react";

/** Full-page ink base, ambient blobs, and viewport-wide cursor glow (Orchid-style continuity). */
export function LandingAtmosphere() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mx = 0.5;
    let my = 0.35;
    let cx = 0.5;
    let cy = 0.35;
    let rafId: number;

    const syncFromPointer = (clientX: number, clientY: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w <= 0 || h <= 0) return;
      mx = clientX / w;
      my = clientY / h;
    };

    const onPointerMove = (e: PointerEvent) => {
      syncFromPointer(e.clientX, e.clientY);
    };

    const tick = () => {
      cx += (mx - cx) * 0.1;
      cy += (my - cy) * 0.1;
      cursor.style.left = `${(cx * 100).toFixed(2)}%`;
      cursor.style.top = `${(cy * 100).toFixed(2)}%`;
      rafId = requestAnimationFrame(tick);
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 55% at 50% 0%, rgba(47,78,162,0.12), transparent 58%),
            radial-gradient(ellipse 90% 70% at 50% 55%, rgba(217,166,63,0.06), transparent 62%),
            var(--eb-navy-900)
          `,
        }}
      />

      <div
        className="aurora-blob absolute left-[10%] top-[8%] h-[55vmax] w-[55vmax] rounded-full opacity-[0.32] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(47,78,162,0.18) 0%, rgba(47,78,162,0.05) 40%, transparent 60%)",
          animation: "aurora-drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob absolute right-[8%] top-[35%] h-[45vmax] w-[45vmax] rounded-full opacity-[0.26] will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(217,166,63,0.12) 0%, rgba(217,166,63,0.03) 35%, transparent 55%)",
          animation: "aurora-drift 22s ease-in-out infinite reverse",
        }}
      />

      <div
        ref={cursorRef}
        className="hero-aurora-cursor absolute h-[min(62vw,520px)] w-[min(62vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-[left,top]"
        style={{
          left: "50%",
          top: "35%",
          opacity: 0.5,
          background:
            "radial-gradient(circle, rgba(47,78,162,0.16) 0%, rgba(217,166,63,0.05) 42%, transparent 68%)",
        }}
      />
    </div>
  );
}
