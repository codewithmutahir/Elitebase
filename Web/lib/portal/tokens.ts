import { createHash, randomBytes } from "crypto";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generatePortalInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPortalInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function portalInviteExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_MS);
}
