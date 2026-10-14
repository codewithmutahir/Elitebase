import {
  Calendar,
  FileSpreadsheet,
  LayoutGrid,
  MapPin,
  ScanFace,
  Tablet,
} from "lucide-react";
import { LandingAtmosphere } from "@/components/landing/landing-atmosphere";
import { LandingBrands } from "@/components/landing/landing-brands";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingResults } from "@/components/landing/landing-results";
import { LandingTestimonial } from "@/components/landing/landing-testimonial";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import type { LucideIcon } from "lucide-react";

const features: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Time clock kiosk",
    description:
      "Tablet at the door—employees punch in with a PIN in seconds, no phones required.",
    icon: Tablet,
  },
  {
    title: "Face verification",
    description:
      "Optional biometric check at the kiosk to reduce buddy punching and protect your team.",
    icon: ScanFace,
  },
  {
    title: "Schedule management",
    description:
      "Plan shifts by role and location so managers know who should be on the floor.",
    icon: Calendar,
  },
  {
    title: "Timesheets",
    description:
      "Review hours by day or week, filter by employee, and export payroll-ready CSV.",
    icon: FileSpreadsheet,
  },
  {
    title: "Multi-location",
    description:
      "Register a kiosk per site and see attendance roll up to one company dashboard.",
    icon: MapPin,
  },
  {
    title: "Real-time dashboard",
    description:
      "See who is clocked in now, today’s activity, and recent punches as they happen.",
    icon: LayoutGrid,
  },
];

export default function LandingPage() {
  return (
    <div className="landing-shell relative min-h-screen bg-(--eb-ink)">
      <LandingAtmosphere />

      <div className="relative">
        <LandingHero />

        <LandingBrands />

        <section id="features" className="relative py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-normal tracking-tight text-(--eb-text) sm:text-4xl">
                Everything you need to run the floor
              </h2>
              <p className="mt-4 text-(--eb-muted)">
                From the front counter to the back office—clock-ins, compliance,
                and reporting without the spreadsheet chaos.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <SpotlightCard key={feature.title} className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-(--eb-border) bg-(--eb-elevated) text-(--eb-accent)">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-(--eb-text)">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-(--eb-muted)">
                      {feature.description}
                    </p>
                  </SpotlightCard>
                );
              })}
            </div>
          </div>
        </section>

        <LandingResults />

        <LandingTestimonial />

        <LandingFaq />

        <section className="relative py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-normal tracking-tight text-(--eb-text) sm:text-4xl">
              Ready to simplify time tracking?
            </h2>
            <p className="mt-4 text-lg text-(--eb-text)">
              Create your company account, add employees, and pair your first kiosk
              in minutes. No credit card required to start.
            </p>
            <div className="mt-10 flex justify-center">
              <LandingButton href="/register" variant="accent" size="hero">
                Get started free
              </LandingButton>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </div>
  );
}
