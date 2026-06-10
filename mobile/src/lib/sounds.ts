import { Audio } from "expo-av";

let successSound: Audio.Sound | null = null;

export async function loadSounds() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/sounds/success.mp3")
    );
    successSound = sound;
  } catch {
    successSound = null;
  }
}

export async function playSuccess() {
  try {
    if (successSound) {
      await successSound.setPositionAsync(0);
      await successSound.playAsync();
    }
  } catch {
    // ignore playback errors
  }
}

export async function unloadSounds() {
  try {
    await successSound?.unloadAsync();
  } catch {
    // ignore
  }
  successSound = null;
}
