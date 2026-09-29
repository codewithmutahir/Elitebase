import { POST as postV1 } from "@/lib/api/v1/kiosk/face-verify-log";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const runtime = "nodejs";
export const POST = defineLegacyApiRoute("kiosk/face-verify-log", postV1);
