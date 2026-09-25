"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { DashboardThemeProvider } from "@/contexts/dashboard-theme-context";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardThemeProvider>
      <div
        className="dashboard-main-glow pointer-events-none fixed inset-0 z-0"
        aria-hidden
      />
      <Sidebar />
      <div className="relative z-[1] flex min-h-screen min-w-0 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6 sm:p-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </DashboardThemeProvider>
  );
}
