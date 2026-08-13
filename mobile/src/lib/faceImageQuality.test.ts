/**
 * Unit cases for blur / brightness quality gate.
 * Run: npx --yes tsx src/lib/faceImageQuality.test.ts
 */
import assert from "node:assert/strict";
import { evaluateLumaAndBlur } from "./faceImageQualityMath";

function solidRgba(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

function checkerboard(width: number, height: number): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const on = (x + y) % 2 === 0;
      const v = on ? 240 : 20;
      const i = (y * width + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

console.log("\n=== Quality gate: too dark ===");
{
  const dark = evaluateLumaAndBlur(solidRgba(32, 32, 10, 10, 10), 32, 32);
  assert.equal(dark.ok, false);
  if (!dark.ok) assert.equal(dark.reason, "too_dark");
  console.log("PASS");
}

console.log("\n=== Quality gate: too bright ===");
{
  const bright = evaluateLumaAndBlur(solidRgba(32, 32, 250, 250, 250), 32, 32);
  assert.equal(bright.ok, false);
  if (!bright.ok) assert.equal(bright.reason, "too_bright");
  console.log("PASS");
}

console.log("\n=== Quality gate: flat mid-gray is blurry ===");
{
  const flat = evaluateLumaAndBlur(solidRgba(32, 32, 120, 120, 120), 32, 32);
  assert.equal(flat.ok, false);
  if (!flat.ok) assert.equal(flat.reason, "too_blurry");
  console.log("PASS");
}

console.log("\n=== Quality gate: high-contrast pattern passes ===");
{
  const sharp = evaluateLumaAndBlur(checkerboard(32, 32), 32, 32);
  assert.equal(sharp.ok, true);
  console.log("PASS", sharp);
}

console.log("\nAll face image quality cases passed.\n");
