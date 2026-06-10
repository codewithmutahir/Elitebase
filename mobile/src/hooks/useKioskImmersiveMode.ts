import { useCallback, useEffect } from "react";
import {
  AppState,
  Platform,
  StatusBar as RNStatusBar,
  type AppStateStatus,
} from "react-native";
import * as NavigationBar from "expo-navigation-bar";

function applyKioskSystemUi() {
  RNStatusBar.setHidden(true, "none");
  if (Platform.OS === "android") {
    void NavigationBar.setVisibilityAsync("hidden");
  }
}

export function useKioskImmersiveMode() {
  const apply = useCallback(() => {
    applyKioskSystemUi();
  }, []);

  useEffect(() => {
    apply();

    const appSub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") apply();
    });

    return () => appSub.remove();
  }, [apply]);

  return { reapply: apply };
}
