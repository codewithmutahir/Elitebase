"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompanyRow } from "@/lib/company";

export type CompanyUser = {
  id: string;
  name: string;
  email: string;
};

export type CompanyContextValue = {
  company: CompanyRow;
  user: CompanyUser;
  isSuperAdmin: boolean;
};

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({
  value,
  children,
}: {
  value: CompanyContextValue;
  children: ReactNode;
}) {
  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}
