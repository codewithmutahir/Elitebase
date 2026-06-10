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

export function generateKioskSetupCode() {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${word}-${digits}`;
}
