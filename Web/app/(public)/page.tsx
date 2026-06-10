import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  LayoutGrid,
  MapPin,
  ScanFace,
  Tablet,
} from "lucide-react";
import Link from "next/link";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
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

const stats = [
  {
    value: "10 sec",
    label: "Average kiosk clock-in",
    detail: "PIN-first flow built for busy shift changes",
  },
  {
    value: "99.9%",
    label: "Platform uptime",
    detail: "Reliable cloud infrastructure for every location",
  },
  {
    value: "500+",
    label: "Businesses on Elitebase",
    detail: "Retail, hospitality, and field teams nationwide",
  },
] as const;

const trustedBy = [
  "Riverside Café",
  "Northline Retail",
  "Harbor & Co.",
  "Summit Clinics",
  "Bluebird Logistics",
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNavbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-blue-50 pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <StatusBadge tone="info" className="mb-6">
              Time tracking · Kiosk clock-in
            </StatusBadge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your team,
              <br />
              always on time.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Elitebase helps employers manage attendance with a simple dashboard
              and on-site kiosk—PIN clock-in, optional face verification, and
              timesheets in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/register"
                size="lg"
                className="min-w-[200px]"
              >
                Get started free
              </ButtonLink>
              <ButtonLink
                href="#features"
                size="lg"
                variant="outline"
                className="min-w-[200px]"
              >
                See how it works
              </ButtonLink>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-4xl lg:mt-16">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trusted by teams at
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustedBy.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold text-slate-400 sm:text-base"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to run the floor
            </h2>
            <p className="mt-4 text-slate-600">
              From the front counter to the back office—clock-ins, compliance, and
              reporting without the spreadsheet chaos.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-slate-100">
                  <CardContent className="pt-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="stats" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Real results on every shift
            </h2>
            <p className="mt-4 text-slate-600">
              Faster clock-ins, fewer disputes, and a clear record when payday
              arrives.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold tracking-tight text-blue-600 sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm text-slate-600">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-700 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to simplify time tracking?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Create your company account, add employees, and pair your first kiosk
            in minutes. No credit card required to start.
          </p>
          <ButtonLink
            href="/register"
            size="lg"
            className="mt-10 min-w-[220px] bg-white text-blue-700 hover:bg-blue-50"
          >
            Get started
          </ButtonLink>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
