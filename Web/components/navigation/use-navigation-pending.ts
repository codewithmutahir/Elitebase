"use client";

import { useSyncExternalStore } from "react";
import {
  getNavigationPending,
  subscribeNavigationPending,
} from "@/lib/navigation/navigation-pending-store";

/** True while soft navigation progress is active (shared with top progress bar). */
export function useNavigationPending() {
  return useSyncExternalStore(
    subscribeNavigationPending,
    getNavigationPending,
    () => false
  );
}
