import { Globe, Link2 } from "lucide-react";
import Link from "next/link";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "/register", label: "Get started" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#stats", label: "Why Elitebase" },
      { href: "/register/employer", label: "For employers" },
      { href: "/register/employee", label: "For employees" },
    ],
  },
  {
    title: "Legal",
    links: [{ href: "/privacy-policy", label: "Privacy policy" }],
  },
  {
    title: "Contact",
    links: [
      {
        href: "mailto:privacy@elitebase.com",
        label: "privacy@elitebase.com",
      },
    ],
  },
] as const;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-slate-900">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition hover:text-blue-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 border-t border-slate-100 pt-8 sm:flex-row sm:items-center">
          <p className="text-lg font-bold text-slate-900">
            Elite<span className="text-blue-600">base</span>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-blue-600"
              aria-label="LinkedIn"
            >
              <Link2 className="size-5" aria-hidden />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-blue-600"
              aria-label="X (Twitter)"
            >
              <Globe className="size-5" aria-hidden />
            </a>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          © {year} Elitebase. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

