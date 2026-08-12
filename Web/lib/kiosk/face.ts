export const FACE_DESCRIPTOR_LENGTH = 512;
/** InsightFace cosine similarity threshold (override via FACE_VERIFY_THRESHOLD). */
export const FACE_MATCH_THRESHOLD = Number.parseFloat(
  process.env.FACE_VERIFY_THRESHOLD?.trim() || "0.45"
) || 0.45;

export function parseFaceDescriptor(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;

  const numbers = value.map((item) => Number(item));
  if (numbers.some((n) => Number.isNaN(n))) return null;
  if (numbers.length !== FACE_DESCRIPTOR_LENGTH) return null;

  return numbers;
}

export function parseStoredDescriptor(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    return parseFaceDescriptor(value);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parseFaceDescriptor(parsed);
    } catch {
      const trimmed = value.replace(/^\[|\]$/g, "");
      if (!trimmed) return null;
      const numbers = trimmed.split(",").map((part) => Number(part.trim()));
      return parseFaceDescriptor(numbers);
    }
  }

  return null;
}

export function formatDescriptorForStorage(descriptor: number[]) {
  return `[${descriptor.join(",")}]`;
}

export function formatDescriptorForPgvector(descriptor: number[]) {
  return `[${descriptor.join(",")}]`;
}
