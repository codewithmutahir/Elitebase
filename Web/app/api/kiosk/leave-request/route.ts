import { POST as postV1 } from "@/lib/api/v1/kiosk/leave-request";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const runtime = "nodejs";
export const POST = defineLegacyApiRoute("kiosk/leave-request", postV1);
