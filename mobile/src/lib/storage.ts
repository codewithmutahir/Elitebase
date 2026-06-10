import * as SecureStore from "expo-secure-store";
import type { TabletConfig } from "@/types";

const TABLET_TOKEN_KEY = "tablet_token";
const TABLET_CONFIG_KEY = "tablet_config";
const CAMERA_FACING_KEY = "camera_facing";

export type CameraFacingPreference = "front" | "back";

export async function saveTabletConfig(config: TabletConfig): Promise<void> {
  await SecureStore.setItemAsync(TABLET_TOKEN_KEY, config.tablet_token);
  await SecureStore.setItemAsync(TABLET_CONFIG_KEY, JSON.stringify(config));
}

export async function getTabletConfig(): Promise<TabletConfig | null> {
  const raw = await SecureStore.getItemAsync(TABLET_CONFIG_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TabletConfig;
  } catch {
    return null;
  }
}

export async function clearTabletConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(TABLET_TOKEN_KEY);
  await SecureStore.deleteItemAsync(TABLET_CONFIG_KEY);
}

export async function getTabletToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TABLET_TOKEN_KEY);
}

export async function getCameraFacing(): Promise<CameraFacingPreference | null> {
  const value = await SecureStore.getItemAsync(CAMERA_FACING_KEY);
  if (value === "front" || value === "back") {
    return value;
  }
  return null;
}

export async function saveCameraFacing(
  facing: CameraFacingPreference
): Promise<void> {
  await SecureStore.setItemAsync(CAMERA_FACING_KEY, facing);
}
