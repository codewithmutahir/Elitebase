/**
 * Pure geometry helpers for the kiosk face upload pipeline.
 * Kept free of RN/native imports so we can unit-test orientation/crop math.
 */

export type FaceBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/** Soft gate: reject only when the face is tiny relative to the short side. */
export const MIN_FACE_RATIO = 0.08;
/** Prefer faces that fill a reasonable portion of the short side. */
export const PREFERRED_MIN_FACE_RATIO = 0.12;
/** Extra margin so InsightFace's detector/aligner has context. */
export const CROP_PADDING_RATIO = 0.8;
/** Short-side target for InsightFace-ready JPEG uploads. */
export const FACE_UPLOAD_SHORT_SIDE = 512;

/**
 * Face size relative to the image short side.
 * Using width alone fails on landscape camera buffers (common on Android).
 */
export function computeFaceRatio(
  bounds: FaceBounds,
  imageWidth: number,
  imageHeight: number
): number {
  const shortSide = Math.max(1, Math.min(imageWidth, imageHeight));
  const faceSpan = Math.max(bounds.width, bounds.height);
  return faceSpan / shortSide;
}

export function isFaceLargeEnough(faceRatio: number): boolean {
  return faceRatio >= MIN_FACE_RATIO;
}

export function isPreferredFaceSize(faceRatio: number): boolean {
  return faceRatio >= PREFERRED_MIN_FACE_RATIO;
}

/**
 * Clamp a padded face crop to image bounds.
 * Returns null when the rect is unusable (would feed InsightFace garbage).
 */
export function computePaddedCrop(
  bounds: FaceBounds,
  imageWidth: number,
  imageHeight: number,
  paddingRatio: number = CROP_PADDING_RATIO
): CropRect | null {
  const width = Math.max(1, imageWidth);
  const height = Math.max(1, imageHeight);

  if (
    !Number.isFinite(bounds.left) ||
    !Number.isFinite(bounds.top) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width < 8 ||
    bounds.height < 8
  ) {
    return null;
  }

  // Bounds clearly from a different coordinate space than the bitmap.
  if (
    bounds.left + bounds.width < 0 ||
    bounds.top + bounds.height < 0 ||
    bounds.left > width ||
    bounds.top > height
  ) {
    return null;
  }

  const padding = Math.max(bounds.width, bounds.height) * paddingRatio;
  const originX = Math.max(0, bounds.left - padding);
  const originY = Math.max(0, bounds.top - padding);
  const cropWidth = Math.min(width - originX, bounds.width + padding * 2);
  const cropHeight = Math.min(height - originY, bounds.height + padding * 2);

  if (cropWidth < 32 || cropHeight < 32) {
    return null;
  }

  const rect: CropRect = {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };

  if (!isValidCropRect(rect, width, height)) {
    return null;
  }

  return rect;
}

export function isValidCropRect(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number
): boolean {
  if (crop.width < 32 || crop.height < 32) return false;
  if (crop.originX < 0 || crop.originY < 0) return false;
  if (crop.originX + crop.width > imageWidth + 1) return false;
  if (crop.originY + crop.height > imageHeight + 1) return false;
  return true;
}

/**
 * When claimed camera dims disagree with the oriented bitmap, crop math is unsafe.
 * Prefer a full-frame resize in that case.
 */
export function dimensionsLookMismatched(
  claimedWidth: number,
  claimedHeight: number,
  bitmapWidth: number,
  bitmapHeight: number
): boolean {
  const cw = Math.max(1, claimedWidth);
  const ch = Math.max(1, claimedHeight);
  const bw = Math.max(1, bitmapWidth);
  const bh = Math.max(1, bitmapHeight);

  // Exact swap (EXIF-rotated portrait vs landscape buffer) is the classic failure.
  if (cw === bh && ch === bw && cw !== ch) {
    return true;
  }

  const claimedArea = cw * ch;
  const bitmapArea = bw * bh;
  const areaRatio =
    Math.max(claimedArea, bitmapArea) / Math.max(1, Math.min(claimedArea, bitmapArea));

  return areaRatio > 1.35;
}

/**
 * Decide upload strategy after local detection.
 * - padded_crop: bounds align with bitmap → tight-ish InsightFace crop
 * - full_frame: safer when orientation/crop math is unreliable
 */
export function chooseUploadStrategy(input: {
  claimedWidth: number;
  claimedHeight: number;
  bitmapWidth: number;
  bitmapHeight: number;
  bounds: FaceBounds;
  faceRatio: number;
}): { strategy: "padded_crop" | "full_frame"; crop: CropRect | null } {
  if (
    dimensionsLookMismatched(
      input.claimedWidth,
      input.claimedHeight,
      input.bitmapWidth,
      input.bitmapHeight
    )
  ) {
    return { strategy: "full_frame", crop: null };
  }

  const crop = computePaddedCrop(
    input.bounds,
    input.bitmapWidth,
    input.bitmapHeight
  );

  if (!crop) {
    return { strategy: "full_frame", crop: null };
  }

  // Tiny faces: keep more context so SCRFD on buffalo_sc can still lock on.
  if (input.faceRatio < PREFERRED_MIN_FACE_RATIO) {
    return { strategy: "full_frame", crop: null };
  }

  return { strategy: "padded_crop", crop };
}

export function resizeActionsForShortSide(
  width: number,
  height: number,
  shortSideTarget: number = FACE_UPLOAD_SHORT_SIDE
): { resize: { width: number } } | { resize: { height: number } } | null {
  const shortSide = Math.min(width, height);
  if (shortSide <= 0) return null;
  if (Math.abs(shortSide - shortSideTarget) <= 40) return null;
  if (width <= height) {
    return { resize: { width: shortSideTarget } };
  }
  return { resize: { height: shortSideTarget } };
}
