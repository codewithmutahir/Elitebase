"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import gsap from "gsap";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  tag?: ElementType;
  textAlign?: CSSProperties["textAlign"];
}

/** ReactBits-style SplitText — no club plugin needed. */
export function SplitText({
  text,
  className = "",
  delay = 30,
  duration = 0.8,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 32 },
  to = { opacity: 1, y: 0 },
  tag: Tag = "span",
  textAlign = "center",
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !fontsReady) return;

    const targets = el.querySelectorAll("[data-split]");
    if (!targets.length) return;

    gsap.set(targets, { ...from });

    const tween = gsap.to(targets, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      force3D: true,
    });

    return () => {
      tween.kill();
    };
  }, [fontsReady, text, delay, duration, ease, from, to]);

  const words = text.trim().split(/\s+/);

  const elements =
    splitType === "words"
      ? words.map((word, i, arr) => (
          <span key={i} className="inline-block" data-split>
            {word}
            {i < arr.length - 1 ? "\u00A0" : ""}
          </span>
        ))
      : words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {wordIndex > 0 ? (
              <span className="inline-block" data-split>
                {"\u00A0"}
              </span>
            ) : null}
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="inline-block" data-split>
                {char}
              </span>
            ))}
          </span>
        ));

  return (
    <Tag
      ref={containerRef as React.RefObject<never>}
      className={className}
      style={{
        textAlign,
        display: "inline-block",
        overflow: "hidden",
      }}
    >
      {elements}
    </Tag>
  );
}
