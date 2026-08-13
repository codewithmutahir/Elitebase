import * as Updates from "expo-updates";

/**
 * Fetch and apply an EAS Update on cold start (production builds only).
 * No-op in __DEV__ / when Updates is disabled.
 */
export async function applyOtaUpdateIfAvailable(): Promise<boolean> {
  if (__DEV__) return false;
  if (!Updates.isEnabled) return false;

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return false;

    const result = await Updates.fetchUpdateAsync();
    if (!result.isNew) return false;

    await Updates.reloadAsync();
    return true;
  } catch {
    // Never block kiosk boot on update failures (offline tablets, etc.).
    return false;
  }
}
