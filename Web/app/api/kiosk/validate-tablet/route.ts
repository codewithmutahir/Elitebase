import { POST as postV1 } from "@/lib/api/v1/kiosk/validate-tablet";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const runtime = "nodejs";
export const POST = defineLegacyApiRoute("kiosk/validate-tablet", postV1);
