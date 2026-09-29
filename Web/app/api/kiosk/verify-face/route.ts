import { POST as postV1 } from "@/lib/api/v1/kiosk/verify-face";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = defineLegacyApiRoute("kiosk/verify-face", postV1);
