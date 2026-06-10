import Constants from "expo-constants";

/** True when running inside the Expo Go app (not a custom dev/production build). */
export function isExpoGo() {
  return Constants.appOwnership === "expo";
}
