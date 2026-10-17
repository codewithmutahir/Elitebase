"use client";

import { usePortalNav } from "@/contexts/portal-nav-context";
import {
  PortalBenefitSkeleton,
  PortalClockSkeleton,
  PortalHomeSkeleton,
  PortalLeaveSkeleton,
  PortalPayslipSkeleton,
  PortalRecordPageSkeleton,
} from "@/components/portal/portal-skeletons";

function skeletonForPath(path: string) {
  if (path.startsWith("/portal/clock")) return <PortalClockSkeleton />;
  if (path.startsWith("/portal/attendance")) {
    return <PortalRecordPageSkeleton stats={4} columns={5} />;
  }
  if (path.startsWith("/portal/pay")) {
    return <PortalRecordPageSkeleton stats={4} columns={6} />;
  }
  if (path.startsWith("/portal/leave")) return <PortalLeaveSkeleton />;
  if (path.startsWith("/portal/benefits")) return <PortalBenefitSkeleton />;
  if (path.startsWith("/portal/payslips")) return <PortalPayslipSkeleton />;
  return <PortalHomeSkeleton />;
}

/** Destination-aware skeleton while portal soft-navigation is pending. */
export function PortalRouteSkeleton() {
  const { pendingHref } = usePortalNav();
  const path = (() => {
    if (!pendingHref) return "/portal";
    try {
      return new URL(pendingHref, "http://local.invalid").pathname;
    } catch {
      return pendingHref.split("?")[0] || "/portal";
    }
  })();

  return skeletonForPath(path);
}
