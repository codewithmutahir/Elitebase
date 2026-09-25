"use client";

import { useCallback, useId, useState } from "react";

const faqItems = [
  {
    id: "what-is-elitebase",
    question: "What is Elitebase?",
    answer:
      "Elitebase is a time tracking and attendance platform for employers. You get a kiosk clock-in at each location, optional face verification, schedules, live dashboards, and timesheets you can export for payroll.",
  },
  {
    id: "kiosk-clock-in",
    question: "How does the kiosk clock-in work?",
    answer:
      "Pair a tablet as a kiosk at your site. Employees enter a PIN to clock in and out—built for fast shift changes at the door. Managers see punches on the dashboard in real time.",
  },
  {
    id: "employee-app",
    question: "Do employees need to download an app?",
    answer:
      "No. The default flow is kiosk-first with a PIN, so floor staff are not required to install anything on personal phones. Your team can still use the web dashboard where it fits your workflow.",
  },
  {
    id: "face-verification",
    question: "Can we turn on face verification at the kiosk?",
    answer:
      "Yes. Face verification is optional. When enabled, it adds a biometric check at punch time to reduce buddy punching while keeping the same PIN-first flow.",
  },
  {
    id: "multi-location",
    question: "Does Elitebase support multiple locations?",
    answer:
      "Yes. Register a kiosk per site, assign employees to locations, and roll attendance up to one company view—so regional or multi-store operators see every shift in one place.",
  },
  {
    id: "timesheets-payroll",
    question: "How do timesheets and payroll exports work?",
    answer:
      "Review hours by day or week, filter by employee or location, and export payroll-ready CSV when you are ready to close the period—without rebuilding hours in a spreadsheet.",
  },
] as const;

function FaqItem({
  item,
  open,
  onToggle,
}: {
  item: (typeof faqItems)[number];
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const triggerId = useId();

  return (
    <div className="border-b border-[var(--eb-border)]">
      <h3 className="m-0">
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left sm:py-7 lg:py-8"
        >
          <span className="text-[1.0625rem] font-normal leading-snug tracking-[-0.01em] text-[var(--eb-text)] transition-colors duration-200 group-hover:text-white sm:text-lg lg:text-[1.125rem]">
            {item.question}
          </span>
          <span
            className="flex size-8 shrink-0 items-center justify-center text-[1.35rem] font-light leading-none text-[var(--eb-text)] transition-transform duration-300 ease-out will-change-transform sm:size-9 sm:text-[1.5rem]"
            style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            +
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-[42rem] pb-6 text-[0.9375rem] leading-relaxed text-[var(--eb-muted)] sm:pb-7 sm:text-base lg:pb-8">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <section
      id="faq"
      className="relative py-20 sm:py-24 lg:py-28"
      aria-labelledby="landing-faq-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <h2
          id="landing-faq-heading"
          className="text-center text-[1.75rem] font-normal tracking-[-0.02em] text-[var(--eb-text)] sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]"
        >
          Frequently asked questions
        </h2>

        <div className="mx-auto mt-10 max-w-[52rem] border-t border-[var(--eb-border)] sm:mt-12 lg:mt-14">
          {faqItems.map((item) => (
            <FaqItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
