"use client";

import Box from "@mui/material/Box";
import MuiButton from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { useDashboardTheme } from "@/contexts/dashboard-theme-context";
import { fadeIn } from "@/lib/animations";
import {
  dashboardAccentLinkSx,
  profileContactLinkSx,
  profileDestructiveOutlineSx,
} from "@/lib/dashboard/sx";
import { employeeInitials } from "@/lib/employees/format";
import type { EmployeeProfile } from "@/lib/employees/profile-queries";

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
  const [action, setAction] = useState<
    "deactivate" | "reactivate" | "delete" | null
  >(null);

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

  const accentLinkButtonSx = {
    ...dashboardAccentLinkSx,
    display: "inline-flex",
    alignItems: "center",
    gap: 0.75,
    border: "none",
    bgcolor: "transparent",
    cursor: "pointer",
    p: 0,
    fontSize: "inherit",
    fontFamily: "inherit",
  };

  return (
    <Stack spacing={3}>
      <Box
        component={Link}
        href="/employees"
        sx={{
          ...dashboardAccentLinkSx,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: "0.875rem",
        }}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to roster
      </Box>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        useFlexGap
        sx={{
          gap: 3,
          alignItems: { lg: "flex-start" },
          justifyContent: { lg: "space-between" },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          useFlexGap
          sx={{ gap: 2, alignItems: { sm: "flex-start" } }}
        >
          <Box
            sx={{
              display: "flex",
              width: 64,
              height: 64,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "1px solid",
              borderColor: (theme) => `${theme.palette.primary.main}4D`,
              bgcolor: (theme) => `${theme.palette.primary.main}26`,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "primary.main",
            }}
          >
            {employeeInitials(employee.full_name)}
          </Box>
          <Stack spacing={1}>
            <Typography
              component="h1"
              sx={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "text.primary",
              }}
            >
              {employee.full_name}
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Employee at {companyName}
            </Typography>
            <Stack
              direction="row"
              useFlexGap
              sx={{
                flexWrap: "wrap",
                alignItems: "center",
                gap: 2,
                fontSize: "0.875rem",
              }}
            >
              {employee.phone ? (
                <Box
                  component="a"
                  href={`tel:${employee.phone}`}
                  sx={profileContactLinkSx}
                >
                  <Phone className="size-4" aria-hidden />
                  {employee.phone}
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  sx={accentLinkButtonSx}
                  onClick={() => setTab("personal")}
                >
                  <Phone className="size-4" aria-hidden />
                  Add phone number
                </Box>
              )}
              {employee.email ? (
                <Box
                  component="a"
                  href={`mailto:${employee.email}`}
                  sx={profileContactLinkSx}
                >
                  <Mail className="size-4" aria-hidden />
                  {employee.email}
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  sx={accentLinkButtonSx}
                  onClick={() => setTab("personal")}
                >
                  <Mail className="size-4" aria-hidden />
                  Add email
                </Box>
              )}
            </Stack>
            {needsContact ? (
              <StatusBadge tone="warning" theme={dashboardTheme}>
                Needs contact information
              </StatusBadge>
            ) : null}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          useFlexGap
          sx={{ flexShrink: 0, flexWrap: "wrap", gap: 1.5, alignItems: "center" }}
        >
          {employee.status === "active" ? (
            <MuiButton
              type="button"
              variant="outlined"
              color="error"
              sx={profileDestructiveOutlineSx}
              onClick={() => setAction("deactivate")}
            >
              Deactivate
            </MuiButton>
          ) : (
            <>
              <StatusBadge tone="error" theme={dashboardTheme}>
                Deactivated
              </StatusBadge>
              <MuiButton
                type="button"
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => setAction("reactivate")}
              >
                Reactivate
              </MuiButton>
            </>
          )}
          <MuiButton
            type="button"
            variant="outlined"
            color="error"
            sx={profileDestructiveOutlineSx}
            onClick={() => setAction("delete")}
          >
            Delete permanently
          </MuiButton>
          <MuiButton
            type="button"
            variant="outlined"
            disabled
            sx={{ borderColor: "divider", color: "text.secondary" }}
          >
            <MessageSquare className="size-4" aria-hidden />
            Message
          </MuiButton>
        </Stack>
      </Stack>

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
    </Stack>
  );
}
