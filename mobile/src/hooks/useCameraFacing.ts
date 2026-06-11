import { useCallback, useEffect, useState } from "react";
import {
  getCameraFacing,
  saveCameraFacing,
  type CameraFacingPreference,
} from "@/lib/storage";
import { onPressHaptic } from "@/lib/kioskUi";

const DEFAULT_FACING: CameraFacingPreference = "front";

export function useCameraFacing() {
  const [facing, setFacing] =
    useState<CameraFacingPreference>(DEFAULT_FACING);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getCameraFacing().then((saved) => {
      if (cancelled) return;
      if (saved) setFacing(saved);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((current) => {
      const next: CameraFacingPreference =
        current === "front" ? "back" : "front";
      void saveCameraFacing(next);
      return next;
    });
    void onPressHaptic("light");
  }, []);

  return { facing, toggleFacing, ready };
}
