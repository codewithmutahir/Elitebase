"use client";

import Link from "next/link";
import { ElitebaseLogo } from "@/components/brand/elitebase-logo";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LandingButton } from "@/components/landing/landing-button";

const navLinks = [
  { href: "#features", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Why Elitebase" },
  { href: "/register/employer", label: "Employers" },
  { href: "/register/employee", label: "Employees" },
] as const;

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        data-landing-navbar
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
      >
        <div className="pointer-events-auto mx-auto flex h-[64px] max-w-[1320px] items-center justify-between px-5 sm:h-[72px] sm:px-8">
          <ElitebaseLogo
            className="shrink-0"
            priority
            onClick={closeMenu}
          />

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 backdrop-blur-md lg:flex">
            {navLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className="rounded-full px-4 py-2 text-[14px] font-medium text-[#ededed]/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <LandingButton
              href="/login"
              variant="ghost"
              size="nav"
              className="hidden lg:inline-flex"
            >
              Sign in
            </LandingButton>
            <LandingButton href="/register" variant="accent" size="nav">
              Get started
            </LandingButton>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#ededed] transition-colors hover:bg-white/[0.06] lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen nav (Orchid-style) */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-[var(--eb-ink)] transition-opacity duration-200 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-white/[0.08] px-5 sm:h-[72px] sm:px-8">
          <ElitebaseLogo
            variant="icon"
            className="shrink-0"
            onClick={closeMenu}
          />
          <div className="flex items-center gap-2">
            <LandingButton href="/register" variant="accent" size="nav">
              Get started
            </LandingButton>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#ededed] hover:bg-white/[0.06]"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col px-5 py-6 sm:px-8">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}-${link.label}`}
              href={link.href}
              className="border-b border-white/[0.06] py-5 text-[22px] font-normal tracking-tight text-[#ededed] first:pt-2"
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-8">
            <LandingButton
              href="/login"
              variant="accent"
              size="hero"
              className="w-full max-w-[320px]"
              onClick={closeMenu}
            >
              Sign in
            </LandingButton>
          </div>
        </nav>
      </div>
    </>
  );
}
