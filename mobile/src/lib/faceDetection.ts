import FaceDetection, { type Frame } from "@react-native-ml-kit/face-detection";
import * as ImageManipulator from "expo-image-manipulator";

export type FaceDetectionFailureReason =
  | "no_face"
  | "multiple_faces"
  | "too_small"
  | "error";

export type FaceDetectionResult =
  | {
      success: true;
      /** Padded face crop sized for InsightFace (not full frame, not 112×112). */
      croppedUri: string;
      bounds: Frame;
      faceRatio: number;
    }
  | { success: false; reason: FaceDetectionFailureReason };

/** Short-side target for InsightFace input crops (pixels). */
export const FACE_UPLOAD_SHORT_SIDE = 640;

/** Soft gate: warn/reject only when face is tiny in frame. */
const MIN_FACE_RATIO = 0.08;
/** Prefer faces that fill a reasonable portion of the shot. */
const PREFERRED_MIN_FACE_RATIO = 0.12;
/** Extra margin around ML Kit bounds so InsightFace aligner has context. */
const CROP_PADDING_RATIO = 0.45;

export function faceQualityMessage(
  reason: FaceDetectionFailureReason
): string {
  switch (reason) {
    case "too_small":
      return "Move closer so your face fills the oval.";
    case "multiple_faces":
      return "Only one face in frame, please.";
    case "no_face":
      return "No face found — center your face in the oval.";
    default:
      return "Could not capture face. Try again with better light.";
  }
}

/**
 * Detect a single face and produce an InsightFace-ready crop.
 * Soft local gate only — final quality decisions belong to the face service.
 */
export async function detectAndCropFace(
  photoUri: string,
  photoWidth: number,
  photoHeight: number
): Promise<FaceDetectionResult> {
  try {
    const width = Math.max(1, photoWidth);
    const height = Math.max(1, photoHeight);

    const faces = await FaceDetection.detect(photoUri, {
      // Fast is enough for a presence/size gate; InsightFace does recognition.
      performanceMode: "fast",
      landmarkMode: "none",
      classificationMode: "none",
      minFaceSize: 0.08,
    });

    if (faces.length === 0) {
      return { success: false, reason: "no_face" };
    }

    if (faces.length > 1) {
      return { success: false, reason: "multiple_faces" };
    }

    const face = faces[0]!;
    const bounds = face.frame;
    const faceRatio = bounds.width / width;

    if (faceRatio < MIN_FACE_RATIO) {
      return { success: false, reason: "too_small" };
    }

    const padding = Math.max(bounds.width, bounds.height) * CROP_PADDING_RATIO;
    const cropX = Math.max(0, bounds.left - padding);
    const cropY = Math.max(0, bounds.top - padding);
    const cropWidth = Math.min(width - cropX, bounds.width + padding * 2);
    const cropHeight = Math.min(height - cropY, bounds.height + padding * 2);

    if (cropWidth < 32 || cropHeight < 32) {
      return { success: false, reason: "too_small" };
    }

    const actions: ImageManipulator.Action[] = [
      {
        crop: {
          originX: Math.round(cropX),
          originY: Math.round(cropY),
          width: Math.round(cropWidth),
          height: Math.round(cropHeight),
        },
      },
    ];

    // Upscale tiny crops / downscale huge ones so short side ≈ 640.
    const shortSide = Math.min(cropWidth, cropHeight);
    if (shortSide > 0 && Math.abs(shortSide - FACE_UPLOAD_SHORT_SIDE) > 40) {
      if (cropWidth <= cropHeight) {
        actions.push({ resize: { width: FACE_UPLOAD_SHORT_SIDE } });
      } else {
        actions.push({ resize: { height: FACE_UPLOAD_SHORT_SIDE } });
      }
    }

    const processed = await ImageManipulator.manipulateAsync(photoUri, actions, {
      compress: 0.92,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      success: true,
      croppedUri: processed.uri,
      bounds,
      faceRatio,
    };
  } catch {
    return { success: false, reason: "error" };
  }
}

export function isPreferredFaceSize(faceRatio: number): boolean {
  return faceRatio >= PREFERRED_MIN_FACE_RATIO;
}
