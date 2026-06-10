import * as Haptics from "expo-haptics";

export async function hapticLight() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticMedium() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticHeavy() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function hapticSuccess() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function hapticError() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Call from Pressable onPressIn for consistent touch feedback */
export function onPressHaptic(
  style: "light" | "medium" | "heavy" = "light"
): void {
  const fn =
    style === "heavy"
      ? hapticHeavy
      : style === "medium"
        ? hapticMedium
        : hapticLight;
  void fn();
}
