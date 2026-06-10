export const FACE_DESCRIPTOR_LENGTH = 512;
export const FACE_VERIFY_THRESHOLD = 0.45;

export type ExtractEmbeddingResult = {
  embedding: number[];
  confidence: number;
  bbox: number[] | null;
  samples_used: number;
};

export type VerifyConfidenceLevel = "high" | "medium" | "low";

export type VerifyFaceServiceResult = {
  verified: boolean;
  confidence: number;
  confidence_level: VerifyConfidenceLevel;
  threshold: number;
  reason?: string;
};

/** Thrown when the face service cannot be reached (down, wrong URL, network). */
export class FaceServiceUnavailableError extends Error {
  constructor(message = "Face recognition service is unavailable.") {
    super(message);
    this.name = "FaceServiceUnavailableError";
  }
}

export function getPythonFaceServiceUrl(): string {
  const url = process.env.PYTHON_FACE_SERVICE_URL?.trim().replace(/\/$/, "");
  if (!url) {
    throw new Error("PYTHON_FACE_SERVICE_URL is not configured.");
  }
  return url;
}

function getInternalApiKey(): string | undefined {
  return process.env.INTERNAL_API_KEY?.trim() || undefined;
}

async function faceServiceFetch(
  path: string,
  body: FormData
): Promise<Response> {
  const headers: Record<string, string> = {};
  const apiKey = getInternalApiKey();
  if (apiKey) {
    headers["X-Internal-Key"] = apiKey;
  }

  try {
    return await fetch(`${getPythonFaceServiceUrl()}${path}`, {
      method: "POST",
      headers,
      body,
    });
  } catch {
    throw new FaceServiceUnavailableError(
      "Face recognition service is unavailable. Please try again or contact your manager."
    );
  }
}

async function readFaceServiceError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      detail?: string | { msg?: string }[];
      error?: string;
    };
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg;
    }
    if (body.error) return body.error;
  } catch {
    // ignore
  }
  return `Face service request failed (${response.status}).`;
}

function appendFilesToForm(form: FormData, files: File[]) {
  for (const file of files) {
    form.append("files", file, file.name || "face.jpg");
  }
}

export async function extractEmbeddingFromImage(
  file: File | File[]
): Promise<ExtractEmbeddingResult> {
  const files = Array.isArray(file) ? file : [file];
  if (files.length === 0) {
    throw new Error("At least one image file is required.");
  }

  const form = new FormData();
  appendFilesToForm(form, files);

  const response = await faceServiceFetch("/extract-embedding", form);

  if (!response.ok) {
    throw new Error(await readFaceServiceError(response));
  }

  const data = (await response.json()) as ExtractEmbeddingResult;
  if (
    !Array.isArray(data.embedding) ||
    data.embedding.length !== FACE_DESCRIPTOR_LENGTH
  ) {
    throw new Error("Face service returned an invalid embedding.");
  }

  return {
    ...data,
    samples_used: data.samples_used ?? files.length,
  };
}

export async function verifyFaceWithService(
  file: File,
  storedEmbedding: number[]
): Promise<VerifyFaceServiceResult> {
  const form = new FormData();
  form.append("file", file, file.name || "face.jpg");
  form.append("stored_embedding", JSON.stringify(storedEmbedding));

  const response = await faceServiceFetch("/verify-face", form);

  if (!response.ok) {
    throw new Error(await readFaceServiceError(response));
  }

  const result = (await response.json()) as VerifyFaceServiceResult;

  if (process.env.NODE_ENV !== "production") {
    console.info("[kiosk/verify-face] python service result", {
      similarity: result.confidence,
      threshold: result.threshold,
      confidence_level: result.confidence_level,
      verified: result.verified,
      reason: result.reason ?? null,
    });
  }

  return result;
}
