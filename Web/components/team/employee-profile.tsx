"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { EmployeeActionDialogs } from "@/components/team/employee-action-dialogs";
import { DocumentsTab } from "@/components/team/profile/documents-tab";
import { JobDetailsTab } from "@/components/team/profile/job-details-tab";
import { PerformanceTab } from "@/components/team/profile/performance-tab";
import { PersonalTab } from "@/components/team/profile/personal-tab";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { fadeIn } from "@/lib/animations";
import {
  profileContactLinkClass,
  profileDestructiveOutlineClass,
  profileLinkClass,
} from "@/lib/dashboard/styles";
import { employeeInitials } from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "job-details", label: "Job Details" },
  { id: "personal", label: "Personal Information" },
  { id: "documents", label: "Documents" },
  { id: "performance", label: "Performance" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type EmployeeProfileViewProps = {
  initialEmployee: EmployeeProfile;
  companyName: string;
};

export function EmployeeProfileView({
  initialEmployee,
  companyName,
}: EmployeeProfileViewProps) {
  const router = useRouter();
  const { theme: dashboardTheme } = useDashboardTheme();
  const [employee, setEmployee] = useState(initialEmployee);
  const [activeTab, setActiveTab] = useState<TabId>("job-details");
  const [action, setAction] = useState<"deactivate" | "reactivate" | "delete" | null>(
    null
  );

  useEffect(() => {
    setEmployee(initialEmployee);
  }, [initialEmployee]);

  const setTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TabId;
    if (TABS.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
    const onHash = () => {
      const h = window.location.hash.replace("#", "") as TabId;
      if (TABS.some((t) => t.id === h)) setActiveTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const patchEmployee = useCallback((patch: Partial<EmployeeProfile>) => {
    setEmployee((prev) => ({ ...prev, ...patch }));
  }, []);

  const needsContact = !employee.phone && !employee.email;

  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-semibold",
          profileLinkClass
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to roster
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[var(--eb-accent)]/30 bg-[var(--eb-accent)]/15 text-xl font-bold text-[var(--eb-accent)]">
            {employeeInitials(employee.full_name)}
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--eb-text)]">
              {employee.full_name}
            </h1>
            <p className="text-sm text-[var(--eb-muted)]">
              Employee at {companyName}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {employee.phone ? (
                <a
                  href={`tel:${employee.phone}`}
                  className={profileContactLinkClass}
                >
                  <Phone className="size-4" aria-hidden />
                  {employee.phone}
                </a>
              ) : (
                <button
                  type="button"
                  className={cn("inline-flex items-center gap-1.5", profileLinkClass)}
                  onClick={() => setTab("personal")}
                >
                  <Phone className="size-4" aria-hidden />
                  Add phone number
                </button>
              )}
              {employee.email ? (
                <a
                  href={`mailto:${employee.email}`}
                  className={profileContactLinkClass}
                >
                  <Mail className="size-4" aria-hidden />
                  {employee.email}
                </a>
              ) : (
                <button
                  type="button"
                  className={cn("inline-flex items-center gap-1.5", profileLinkClass)}
                  onClick={() => setTab("personal")}
                >
                  <Mail className="size-4" aria-hidden />
                  Add email
                </button>
              )}
            </div>
            {needsContact ? (
              <StatusBadge tone="warning" theme={dashboardTheme}>
                Needs contact information
              </StatusBadge>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {employee.status === "active" ? (
            <Button
              type="button"
              variant="outline"
              className={profileDestructiveOutlineClass}
              onClick={() => setAction("deactivate")}
            >
              Deactivate
            </Button>
          ) : (
            <>
              <StatusBadge tone="error" theme={dashboardTheme}>
                Deactivated
              </StatusBadge>
              <Button
                type="button"
                variant="outline"
                className="border-[var(--eb-border)] text-[var(--eb-text)] hover:bg-[var(--eb-hover-overlay)]"
                onClick={() => setAction("reactivate")}
              >
                Reactivate
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className={profileDestructiveOutlineClass}
            onClick={() => setAction("delete")}
          >
            Delete permanently
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            className="border-[var(--eb-border)] text-[var(--eb-muted)]"
          >
            <MessageSquare className="size-4" aria-hidden />
            Message
          </Button>
        </div>
      </div>

      <DashboardTabs tabs={[...TABS]} value={activeTab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "job-details" ? (
            <JobDetailsTab
              employee={employee}
              companyName={companyName}
              onUpdated={patchEmployee}
            />
          ) : null}
          {activeTab === "personal" ? (
            <PersonalTab employee={employee} onUpdated={patchEmployee} />
          ) : null}
          {activeTab === "documents" ? (
            <DocumentsTab
              employeeId={employee.id}
              documents={employee.documents}
              onUpdated={() => router.refresh()}
            />
          ) : null}
          {activeTab === "performance" ? (
            <PerformanceTab
              employee={employee}
              onUpdated={() => router.refresh()}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <EmployeeActionDialogs
        employee={{
          id: employee.id,
          full_name: employee.full_name,
          status: employee.status,
        }}
        action={action}
        onClose={() => setAction(null)}
        redirectOnDelete
      />
    </div>
  );
}
