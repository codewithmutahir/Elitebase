import FaceDetection, { type Frame } from "@react-native-ml-kit/face-detection";
import * as ImageManipulator from "expo-image-manipulator";
import {
  assessFaceImageQuality,
  faceImageQualityMessage,
} from "@/lib/faceImageQuality";
import {
  FACE_UPLOAD_SHORT_SIDE,
  chooseUploadStrategy,
  computeFaceRatio,
  isFaceLargeEnough,
  resizeActionsForShortSide,
  type FaceBounds,
} from "@/lib/facePipelineMath";

export type FaceDetectionFailureReason =
  | "no_face"
  | "multiple_faces"
  | "too_small"
  | "too_dark"
  | "too_bright"
  | "too_blurry"
  | "face_turned"
  | "error";

export type FaceDetectionResult =
  | {
      success: true;
      /** InsightFace-ready JPEG (orientation-normalized; crop or full frame). */
      croppedUri: string;
      bounds: Frame;
      faceRatio: number;
      /** How the upload image was produced — useful for debugging. */
      uploadStrategy: "padded_crop" | "full_frame";
    }
  | { success: false; reason: FaceDetectionFailureReason };

export {
  FACE_UPLOAD_SHORT_SIDE,
  MIN_FACE_RATIO,
  PREFERRED_MIN_FACE_RATIO,
  isPreferredFaceSize,
} from "@/lib/facePipelineMath";

/** Soft max |yaw|/|pitch| (degrees) for enrollment-quality frontal faces. */
const MAX_HEAD_YAW_DEG = 28;
const MAX_HEAD_PITCH_DEG = 24;

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
    case "too_dark":
    case "too_bright":
    case "too_blurry":
      return faceImageQualityMessage(reason);
    case "face_turned":
      return "Look more toward the camera — keep your face mostly frontal.";
    default:
      return "Could not capture face. Try again with better light.";
  }
}

function frameToBounds(frame: Frame): FaceBounds {
  return {
    left: frame.left,
    top: frame.top,
    width: frame.width,
    height: frame.height,
  };
}

function readHeadAngles(face: Record<string, unknown>): {
  yaw: number | null;
  pitch: number | null;
} {
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  const yaw =
    num(face.rotationY) ??
    num(face.headEulerAngleY) ??
    num(face.yawAngle);
  const pitch =
    num(face.rotationX) ??
    num(face.headEulerAngleX) ??
    num(face.pitchAngle);

  return { yaw, pitch };
}

function isMostlyFrontal(face: Record<string, unknown>): boolean {
  const { yaw, pitch } = readHeadAngles(face);
  if (yaw != null && Math.abs(yaw) > MAX_HEAD_YAW_DEG) return false;
  if (pitch != null && Math.abs(pitch) > MAX_HEAD_PITCH_DEG) return false;
  return true;
}

/**
 * Bake EXIF orientation into pixel data and return true bitmap size.
 * Camera `photo.width/height` often disagree with the JPEG pixel grid.
 */
async function normalizeOrientation(photoUri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  const normalized = await ImageManipulator.manipulateAsync(photoUri, [], {
    compress: 1,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return {
    uri: normalized.uri,
    width: Math.max(1, normalized.width),
    height: Math.max(1, normalized.height),
  };
}

async function resizeToUploadShortSide(
  uri: string,
  width: number,
  height: number
): Promise<string> {
  const resize = resizeActionsForShortSide(
    width,
    height,
    FACE_UPLOAD_SHORT_SIDE
  );
  if (!resize) {
    const passthrough = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return passthrough.uri;
  }

  const processed = await ImageManipulator.manipulateAsync(uri, [resize], {
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return processed.uri;
}

/**
 * Detect a single face and produce an InsightFace-ready JPEG.
 *
 * Priority #1–3 pipeline rules:
 * 1) Normalize orientation before ML Kit / crop
 * 2) Size gate vs short side (not landscape long side)
 * 3) Prefer padded crop only when bounds match the bitmap; else full frame
 * 4) Reject blur / bad lighting / extreme pose before upload
 * Soft local gate only — final recognition belongs to the face service.
 */
export async function detectAndCropFace(
  photoUri: string,
  photoWidth: number,
  photoHeight: number,
  options?: { requireFrontal?: boolean }
): Promise<FaceDetectionResult> {
  const requireFrontal = options?.requireFrontal ?? false;

  try {
    const normalized = await normalizeOrientation(photoUri);

    const faces = await FaceDetection.detect(normalized.uri, {
      // Accurate is slower but reduces false "no_face" on kiosk lighting.
      performanceMode: "accurate",
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

    const faceObj = faces[0] as unknown as {
      frame: Frame;
    } & Record<string, unknown>;
    const bounds = faceObj.frame;
    const faceBounds = frameToBounds(bounds);
    const faceRatio = computeFaceRatio(
      faceBounds,
      normalized.width,
      normalized.height
    );

    if (!isFaceLargeEnough(faceRatio)) {
      return { success: false, reason: "too_small" };
    }

    if (requireFrontal && !isMostlyFrontal(faceObj)) {
      return { success: false, reason: "face_turned" };
    }

    const decision = chooseUploadStrategy({
      claimedWidth: photoWidth,
      claimedHeight: photoHeight,
      bitmapWidth: normalized.width,
      bitmapHeight: normalized.height,
      bounds: faceBounds,
      faceRatio,
    });

    let uploadUri: string;
    let uploadStrategy: "padded_crop" | "full_frame";

    if (decision.strategy === "padded_crop" && decision.crop) {
      const actions: ImageManipulator.Action[] = [
        {
          crop: {
            originX: decision.crop.originX,
            originY: decision.crop.originY,
            width: decision.crop.width,
            height: decision.crop.height,
          },
        },
      ];

      const resize = resizeActionsForShortSide(
        decision.crop.width,
        decision.crop.height,
        FACE_UPLOAD_SHORT_SIDE
      );
      if (resize) actions.push(resize);

      const processed = await ImageManipulator.manipulateAsync(
        normalized.uri,
        actions,
        {
          compress: 0.82,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      uploadUri = processed.uri;
      uploadStrategy = "padded_crop";
    } else {
      uploadUri = await resizeToUploadShortSide(
        normalized.uri,
        normalized.width,
        normalized.height
      );
      uploadStrategy = "full_frame";
    }

    const quality = await assessFaceImageQuality(uploadUri);
    if (!quality.ok) {
      return { success: false, reason: quality.reason };
    }

    return {
      success: true,
      croppedUri: uploadUri,
      bounds,
      faceRatio,
      uploadStrategy,
    };
  } catch {
    return { success: false, reason: "error" };
  }
}
