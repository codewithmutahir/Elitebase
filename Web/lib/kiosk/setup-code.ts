import { randomInt } from "node:crypto";

const CODE_WORDS = [
  "ALPHA",
  "BRAVO",
  "DELTA",
  "ECHO",
  "FOXTROT",
  "GAMMA",
  "HOTEL",
  "KILO",
  "LIMA",
  "NOVA",
  "OMEGA",
  "SIGMA",
] as const;

/**
 * Human-readable setup code with CSPRNG entropy.
 * Format: WORD-XXXX-XXXXXXXX (word + 4 digits + 8 hex) ≈ 32+ bits beyond the word.
 */
export function generateKioskSetupCode() {
  const word = CODE_WORDS[randomInt(CODE_WORDS.length)];
  const digits = String(randomInt(1000, 10000));
  const suffix = randomInt(0x100000000)
    .toString(16)
    .padStart(8, "0")
    .toUpperCase();
  return `${word}-${digits}-${suffix}`;
}
