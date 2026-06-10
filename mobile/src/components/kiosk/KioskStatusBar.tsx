import { StatusBar } from "expo-status-bar";

/**
 * Single source of truth for hiding the system status bar in kiosk mode.
 */
export function KioskStatusBar() {
  return <StatusBar hidden />;
}
