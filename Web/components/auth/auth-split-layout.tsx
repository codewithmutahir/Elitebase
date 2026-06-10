import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  children: ReactNode;
  tagline?: string;
  features?: readonly string[];
};

export function AuthSplitLayout({
  children,
  tagline,
  features,
}: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <AuthBrandPanel tagline={tagline} features={features} />

      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Elite<span className="text-blue-600">base</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-blue-600"
          >
            Home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
