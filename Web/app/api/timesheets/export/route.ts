import { GET as getV1 } from "@/lib/api/v1/timesheets/export";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const GET = defineLegacyApiRoute("timesheets/export", getV1);
