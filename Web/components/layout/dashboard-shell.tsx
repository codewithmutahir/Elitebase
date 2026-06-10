"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[auto_1fr] bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
