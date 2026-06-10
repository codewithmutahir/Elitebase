import FaceDetection, { type Face } from "@react-native-ml-kit/face-detection";
import * as ImageManipulator from "expo-image-manipulator";
import type { Frame } from "@react-native-ml-kit/face-detection";

export type FaceDetectionFailureReason =
  | "no_face"
  | "multiple_faces"
  | "too_small"
  | "error";

export type FaceDetectionResult =
  | { success: true; croppedUri: string; bounds: Frame }
  | { success: false; reason: FaceDetectionFailureReason };

export async function detectAndCropFace(
  photoUri: string,
  photoWidth: number,
  photoHeight: number
): Promise<FaceDetectionResult> {
  try {
    const faces = await FaceDetection.detect(photoUri, {
      performanceMode: "accurate",
      landmarkMode: "all",
      classificationMode: "all",
      minFaceSize: 0.15,
    });

    if (faces.length === 0) {
      return { success: false, reason: "no_face" };
    }

    if (faces.length > 1) {
      return { success: false, reason: "multiple_faces" };
    }

    const face = faces[0]!;
    const bounds = face.frame;

    if (bounds.width < photoWidth * 0.12) {
      return { success: false, reason: "too_small" };
    }

    const padding = bounds.width * 0.2;
    const cropX = Math.max(0, bounds.left - padding);
    const cropY = Math.max(0, bounds.top - padding);
    const cropWidth = Math.min(photoWidth - cropX, bounds.width + padding * 2);
    const cropHeight = Math.min(
      photoHeight - cropY,
      bounds.height + padding * 2
    );

    const processed = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        {
          crop: {
            originX: Math.round(cropX),
            originY: Math.round(cropY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
          },
        },
        { resize: { width: 112, height: 112 } },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );

    return {
      success: true,
      croppedUri: processed.uri,
      bounds,
    };
  } catch {
    return { success: false, reason: "error" };
  }
}

