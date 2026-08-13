import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";
import {
  evaluateLumaAndBlur,
  faceImageQualityMessage,
  type FaceImageQualityFailure,
  type FaceImageQualityResult,
} from "@/lib/faceImageQualityMath";

export type { FaceImageQualityFailure, FaceImageQualityResult };
export { faceImageQualityMessage, evaluateLumaAndBlur };

/**
 * Downscale the capture, decode JPEG pixels, and reject dark/bright/blurry frames
 * before they hit InsightFace.
 */
export async function assessFaceImageQuality(
  imageUri: string
): Promise<FaceImageQualityResult> {
  try {
    const tiny = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 96 } }],
      {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!tiny.base64) {
      return { ok: false, reason: "error" };
    }

    const binary = atob(tiny.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decoded = jpeg.decode(bytes, { useTArray: true });
    return evaluateLumaAndBlur(
      decoded.data,
      decoded.width,
      decoded.height
    );
  } catch {
    // Quality gate must not hard-block if decode fails on a device quirk.
    return { ok: true, meanLuma: 128, blurVariance: 999 };
  }
}
