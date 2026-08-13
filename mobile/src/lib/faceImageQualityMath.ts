/** Pure luma/blur checks — no RN imports (unit-testable). */

export type FaceImageQualityFailure =
  | "too_dark"
  | "too_bright"
  | "too_blurry"
  | "error";

export type FaceImageQualityResult =
  | {
      ok: true;
      meanLuma: number;
      blurVariance: number;
    }
  | {
      ok: false;
      reason: FaceImageQualityFailure;
      meanLuma?: number;
      blurVariance?: number;
    };

/** Mean grayscale luminance bands (0–255). */
const MIN_MEAN_LUMA = 42;
const MAX_MEAN_LUMA = 220;
/**
 * Laplacian-ish variance on a tiny grayscale grid.
 * Tuned for ~96px analysis crops — reject only clearly soft frames.
 */
const MIN_BLUR_VARIANCE = 18;

export function faceImageQualityMessage(
  reason: FaceImageQualityFailure
): string {
  switch (reason) {
    case "too_dark":
      return "Too dark — face a light or turn toward a brighter area.";
    case "too_bright":
      return "Too bright — avoid strong backlight or glare.";
    case "too_blurry":
      return "Hold still — photo was blurry.";
    default:
      return "Could not check photo quality. Try again.";
  }
}

/** Pure checks used by unit tests and runtime. */
export function evaluateLumaAndBlur(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number
): FaceImageQualityResult {
  if (width < 8 || height < 8 || pixels.length < width * height * 3) {
    return { ok: false, reason: "error" };
  }

  let lumaSum = 0;
  const gray = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i] ?? 0;
      const g = pixels[i + 1] ?? 0;
      const b = pixels[i + 2] ?? 0;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[y * width + x] = luma;
      lumaSum += luma;
    }
  }

  const meanLuma = lumaSum / (width * height);
  if (meanLuma < MIN_MEAN_LUMA) {
    return { ok: false, reason: "too_dark", meanLuma, blurVariance: 0 };
  }
  if (meanLuma > MAX_MEAN_LUMA) {
    return { ok: false, reason: "too_bright", meanLuma, blurVariance: 0 };
  }

  let lapSum = 0;
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const c = gray[y * width + x]!;
      const lap =
        -c * 4 +
        gray[y * width + (x - 1)]! +
        gray[y * width + (x + 1)]! +
        gray[(y - 1) * width + x]! +
        gray[(y + 1) * width + x]!;
      lapSum += lap;
      lapSq += lap * lap;
      count += 1;
    }
  }

  if (count < 16) {
    return { ok: false, reason: "error", meanLuma };
  }

  const meanLap = lapSum / count;
  const blurVariance = lapSq / count - meanLap * meanLap;

  if (blurVariance < MIN_BLUR_VARIANCE) {
    return { ok: false, reason: "too_blurry", meanLuma, blurVariance };
  }

  return { ok: true, meanLuma, blurVariance };
}
