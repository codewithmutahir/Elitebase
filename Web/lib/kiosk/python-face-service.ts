export const FACE_DESCRIPTOR_LENGTH = 512;
/** Default InsightFace cosine similarity threshold; override via FACE_VERIFY_THRESHOLD. */
export const FACE_VERIFY_THRESHOLD = Number.parseFloat(
  process.env.FACE_VERIFY_THRESHOLD?.trim() || "0.45"
) || 0.45;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 85_000);

  try {
    return await fetch(`${getPythonFaceServiceUrl()}${path}`, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err) {
    const aborted =
      (err instanceof Error && err.name === "AbortError") ||
      (typeof DOMException !== "undefined" && err instanceof DOMException);
    throw new FaceServiceUnavailableError(
      aborted
        ? "Face recognition timed out. Please try again."
        : "Face recognition service is unavailable. Please try again or contact your manager."
    );
  } finally {
    clearTimeout(timer);
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

function throwIfFaceServiceCapacityError(response: Response, detail: string): void {
  // Render free cold-start / sleep → 503; overload or our own limiter → 429.
  // These are transport/capacity — not "wrong face".
  if (response.status === 503 || response.status === 429 || response.status === 502) {
    throw new FaceServiceUnavailableError(
      response.status === 429
        ? "Face service is busy. Please wait a moment and try again."
        : "Face recognition service is temporarily unavailable. Please try again."
    );
  }
  throw new Error(detail || `Face service request failed (${response.status}).`);
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
    throwIfFaceServiceCapacityError(
      response,
      await readFaceServiceError(response)
    );
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
  storedEmbedding: number[],
  options?: { employeeId?: string }
): Promise<VerifyFaceServiceResult> {
  const form = new FormData();
  form.append("file", file, file.name || "face.jpg");
  form.append("stored_embedding", JSON.stringify(storedEmbedding));
  if (options?.employeeId) {
    form.append("employee_id", options.employeeId);
  }

  const response = await faceServiceFetch("/verify-face", form);

  if (!response.ok) {
    throwIfFaceServiceCapacityError(
      response,
      await readFaceServiceError(response)
    );
  }

  const result = (await response.json()) as VerifyFaceServiceResult;

  console.info(
    "[kiosk/verify-face] python service result",
    JSON.stringify({
      employee_id: options?.employeeId ?? null,
      similarity_score: result.confidence,
      threshold_used: result.threshold,
      verified: result.verified,
      service_reason: result.reason ?? null,
      confidence_level: result.confidence_level,
    })
  );

  return result;
}
