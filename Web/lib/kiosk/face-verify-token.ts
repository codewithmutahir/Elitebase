import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

type FaceVerifyPayload = {
  employeeId: string;
  tabletId: string;
  companyId: string;
  score: number;
  exp: number;
};

function signingSecret() {
  const secret =
    process.env.FACE_VERIFY_TOKEN_SECRET?.trim() ||
    process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("FACE_VERIFY_TOKEN_SECRET or BETTER_AUTH_SECRET is required");
  }
  return secret;
}

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

/** Issue a short-lived proof after server-side face verify succeeds. */
export function issueFaceVerifyToken(input: {
  employeeId: string;
  tabletId: string;
  companyId: string;
  score: number;
}): string {
  const payload: FaceVerifyPayload = {
    employeeId: input.employeeId,
    tabletId: input.tabletId,
    companyId: input.companyId,
    score: input.score,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", signingSecret()).update(body).digest()
  );
  return `${body}.${sig}`;
}

/** Validate proof for clock-action; returns server score or null. */
export function consumeFaceVerifyToken(
  token: string,
  expected: { employeeId: string; tabletId: string; companyId: string }
): { score: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  let expectedSig: Buffer;
  try {
    expectedSig = createHmac("sha256", signingSecret()).update(body).digest();
  } catch {
    return null;
  }

  const givenSig = fromB64url(sig);
  if (
    givenSig.length !== expectedSig.length ||
    !timingSafeEqual(givenSig, expectedSig)
  ) {
    return null;
  }

  let payload: FaceVerifyPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as FaceVerifyPayload;
  } catch {
    return null;
  }

  if (
    !payload ||
    typeof payload.exp !== "number" ||
    payload.exp < Date.now() ||
    payload.employeeId !== expected.employeeId ||
    payload.tabletId !== expected.tabletId ||
    payload.companyId !== expected.companyId ||
    typeof payload.score !== "number" ||
    Number.isNaN(payload.score)
  ) {
    return null;
  }

  return { score: payload.score };
}
