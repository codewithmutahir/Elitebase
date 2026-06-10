import { Briefcase, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const roleCards: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/register/employer",
    title: "I'm an Employer",
    description: "Register your business and manage your team",
    icon: Briefcase,
  },
  {
    href: "/register/employee",
    title: "I'm an Employee",
    description: "Access your schedule and attendance",
    icon: User,
  },
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Elite<span className="text-blue-600">base</span>
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How will you use Elitebase?
          </h1>
          <p className="mt-3 text-slate-600">
            Choose the path that matches your role. Employers set up the company;
            employees clock in at the workplace kiosk.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="group block">
                <Card
                  className={cn(
                    "h-full border-slate-200 transition duration-200",
                    "group-hover:border-blue-300 group-hover:bg-blue-50/50 group-hover:shadow-md"
                  )}
                >
                  <CardContent className="flex h-full flex-col p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <Icon className="size-6" aria-hidden />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-slate-900">
                      {card.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                      {card.description}
                    </p>
                    <span className="mt-6 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                      Continue →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
