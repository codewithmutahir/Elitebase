import { PortalHomeSkeleton } from "@/components/portal/portal-skeletons";

/** Fallback while a portal segment resolves (shared layout stays mounted). */
export default function PortalAppLoading() {
  return <PortalHomeSkeleton />;
}
