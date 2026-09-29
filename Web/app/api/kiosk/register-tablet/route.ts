import { POST as postV1 } from "@/lib/api/v1/kiosk/register-tablet";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const runtime = "nodejs";
export const POST = defineLegacyApiRoute("kiosk/register-tablet", postV1);
